"use server";

import { randomBytes, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { ambassadors, passwordResetTokens, signupChallenges, users } from "@/db/schema";
import type { SignupPayload } from "@/db/schema/ambassadors";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  hashToken,
} from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import { encryptField } from "@/lib/crypto";
import { authenticateWithPassword, safeAdminPath } from "@/lib/primary-admin";
import { sendSignupCodeEmail, sendTemplatedEmail } from "@/lib/email";
import { getRequestSiteUrl } from "@/lib/env";
import { getMailSettings, inboxFor } from "@/lib/mail";
import { resolveMembershipPlace } from "@/lib/nigeria-gazetteer";
import { isNigeriaPlace, NOT_APPLICABLE, zoneForState } from "@/lib/nigeria-locations";
import { RELIGION_OPTIONS, resolveReligion } from "@/lib/religions";
import { normalizeReferralCode } from "@/lib/referral-tiers";
import { allocateReferralCode, findActiveReferrer } from "@/lib/referrals";
import { assignVolunteerRole } from "@/lib/volunteer-slots";
import { normalizeWhatsapp, sendWhatsappCode } from "@/lib/whatsapp";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { revalidatePath } from "next/cache";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const user = await authenticateWithPassword(email, password);
  if (!user) {
    return { error: "Those details did not match an active account." };
  }

  await createSession(user.id);

  if (next.startsWith("/admin")) redirect(safeAdminPath(next));
  if (next.startsWith("/") && !next.startsWith("/signup") && !next.startsWith("/login")) {
    redirect(next);
  }
  if (user.roleId) redirect("/admin");
  redirect("/dashboard");
}

export async function staffLoginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const user = await authenticateWithPassword(email, password);
  if (!user) {
    return { error: "Those details did not match a staff account." };
  }
  if (!user.roleId) {
    return { error: "This portal is for GLAI staff. Ambassadors use the member sign-in." };
  }

  await createSession(user.id);
  redirect(safeAdminPath(next));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function staffLogoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomBytes(32).toString("hex");
    await getDb().insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    await sendTemplatedEmail({
      type: "password_reset",
      to: user.email,
      role: "passwordResetFrom",
      vars: {
        name: user.name,
        resetUrl: `${await getRequestSiteUrl()}/reset-password?token=${token}`,
      },
    });
  }
}

export async function resetPasswordAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) {
    return { error: "Choose a password of at least 10 characters." };
  }
  const tokenHash = hashToken(token);
  const [row] = await getDb()
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }
  await getDb()
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, row.userId));
  await getDb().delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id));
  return { ok: true };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function countryFromValue(value: string) {
  const match = COUNTRIES.find(
    (row) => row.name.toLowerCase() === value.toLowerCase() || row.code.toLowerCase() === value.toLowerCase(),
  );
  return { country: match?.name ?? value, countryCode: match?.code ?? "ZZ" };
}

export async function startSignupAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const otpChannel = field(formData, "otpChannel") === "email" ? "email" : "whatsapp";
  const religion = resolveReligion(field(formData, "religion"), field(formData, "religionOther"));
  const payload: SignupPayload = {
    fullName: field(formData, "fullName"),
    email: field(formData, "email").toLowerCase(),
    whatsapp: field(formData, "whatsapp"),
    age: Number(field(formData, "age")),
    country: field(formData, "country"),
    stateOfOrigin: field(formData, "stateOfOrigin"),
    localGovernment: field(formData, "localGovernment"),
    electoralWard: field(formData, "electoralWard") || null,
    pollingUnit: field(formData, "pollingUnit") || null,
    currentAddress: field(formData, "currentAddress"),
    nationality: field(formData, "nationality"),
    tribe: field(formData, "tribe"),
    religion,
    education: field(formData, "education"),
    occupation: field(formData, "occupation"),
    organization: field(formData, "organization"),
    otpChannel,
  };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const roleSlug = field(formData, "role") || null;

  const missing = Object.entries(payload).filter(([key, value]) => {
    if (key === "age") return !Number.isFinite(payload.age) || payload.age < 13 || payload.age > 120;
    if (key === "otpChannel" || key === "electoralWard" || key === "pollingUnit") return false;
    return !String(value ?? "").trim();
  });
  if (missing.length) {
    return { error: "Please complete every field on the form." };
  }
  if (!payload.email.includes("@")) return { error: "Enter a valid email address." };
  if (field(formData, "religion") === "Other" && !field(formData, "religionOther")) {
    return { error: "Please specify your religion, or choose one of the listed options." };
  }
  if (field(formData, "religion") && field(formData, "religion") !== "Other" && !(RELIGION_OPTIONS as readonly string[]).includes(field(formData, "religion"))) {
    return { error: "Choose a religion from the list." };
  }
  const place = await resolveMembershipPlace({
    stateOfOrigin: payload.stateOfOrigin,
    localGovernment: payload.localGovernment,
    electoralWard: payload.electoralWard,
    pollingUnit: payload.pollingUnit,
  });
  if (!place.ok) return { error: place.error };
  payload.stateOfOrigin = place.value.stateOfOrigin;
  payload.localGovernment = place.value.localGovernment;
  payload.electoralWard = place.value.electoralWard;
  payload.pollingUnit = place.value.pollingUnit;
  if (isNigeriaPlace(payload.nationality) && payload.stateOfOrigin === NOT_APPLICABLE) {
    return { error: "Nigerian members should select a state of origin." };
  }
  const whatsapp = normalizeWhatsapp(payload.whatsapp);
  if (!whatsapp) return { error: "Enter a valid WhatsApp number with country code, e.g. +2348012345678." };
  payload.whatsapp = whatsapp;
  if (password.length < 10) return { error: "Choose a password of at least 10 characters." };
  if (password !== confirm) return { error: "The password confirmation does not match." };

  const typedReferral = field(formData, "referralCode");
  if (typedReferral) {
    const normalized = normalizeReferralCode(typedReferral);
    if (!normalized) {
      return { error: "Enter a referral code like GLAI-XXXXXX, or leave the field blank." };
    }
    const referrer = await findActiveReferrer(normalized);
    if (!referrer) {
      return { error: "That referral code was not found. Check it with the member who invited you, or leave the field blank." };
    }
    if (referrer.email.toLowerCase() === payload.email) {
      return { error: "That code belongs to this email address. Leave the field blank to sign up." };
    }
    payload.referralCode = referrer.referralCode ?? normalized;
  } else {
    payload.referralCode = null;
  }

  const db = getDb();
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, payload.email)).limit(1);
  if (existingUser) {
    return { error: "An account already exists for this email. Sign in, or use Forgot password." };
  }
  const [existingMember] = await db
    .select({ id: ambassadors.id })
    .from(ambassadors)
    .where(eq(ambassadors.email, payload.email))
    .limit(1);
  if (existingMember) {
    return { error: "An account already exists for this email. Sign in, or use Forgot password." };
  }

  const code = String(randomInt(1000, 10000));
  const [challenge] = await db
    .insert(signupChallenges)
    .values({
      email: payload.email,
      whatsapp,
      codeHash: hashToken(code),
      passwordHash: await hashPassword(password),
      payload,
      volunteerRoleSlug: roleSlug,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })
    .returning({ id: signupChallenges.id });

  let hint = "";
  try {
    if (otpChannel === "email") {
      const result = await sendSignupCodeEmail(payload.email, code, payload.fullName);
      if (result.sandbox) hint = code;
    } else {
      const result = await sendWhatsappCode(whatsapp, code);
      if (result.skipped) hint = code;
    }
  } catch (error) {
    const fallback =
      otpChannel === "email"
        ? "Could not send the email code. Check the address and try again, or choose WhatsApp."
        : "Could not send the WhatsApp code. Check the number and try again, or choose email.";
    return { error: error instanceof Error ? error.message : fallback };
  }

  const confirmUrl = new URL("/signup/confirm", "http://placeholder.local");
  confirmUrl.searchParams.set("id", challenge.id);
  if (hint) confirmUrl.searchParams.set("dev", hint);
  redirect(`${confirmUrl.pathname}${confirmUrl.search}`);
}

export async function confirmSignupAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const id = field(formData, "id");
  const code = field(formData, "code").replace(/\D/g, "");
  if (!id || code.length !== 4) return { error: "Enter the 4-digit code we sent." };

  const db = getDb();
  const [challenge] = await db.select().from(signupChallenges).where(eq(signupChallenges.id, id)).limit(1);
  if (!challenge) return { error: "This confirmation has expired. Please sign up again." };
  if (challenge.expiresAt < new Date()) return { error: "This code has expired. Please sign up again." };
  if (challenge.attempts >= 5) return { error: "Too many attempts. Please sign up again." };

  if (hashToken(code) !== challenge.codeHash) {
    await db
      .update(signupChallenges)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(signupChallenges.id, id));
    return { error: "That code did not match. Check the message and try again." };
  }

  const payload = challenge.payload;
  const { country, countryCode } = countryFromValue(payload.country || payload.nationality);
  let referredById: string | null = null;
  if (payload.referralCode) {
    const referrer = await findActiveReferrer(payload.referralCode);
    if (referrer && referrer.email.toLowerCase() !== payload.email.toLowerCase()) {
      referredById = referrer.id;
    }
  }
  const referralCode = await allocateReferralCode();
  const [created] = await db
    .insert(users)
    .values({
      email: payload.email,
      name: payload.fullName,
      passwordHash: challenge.passwordHash,
      emailVerifiedAt: new Date(),
      isActive: true,
    })
    .returning();

  await db.insert(ambassadors).values({
    userId: created.id,
    fullName: payload.fullName,
    email: payload.email,
    phone: encryptField(payload.whatsapp),
    whatsapp: encryptField(payload.whatsapp),
    age: payload.age,
    stateOfOrigin: payload.stateOfOrigin,
    localGovernment: payload.localGovernment,
    geoPoliticalZone: zoneForState(payload.stateOfOrigin),
    electoralWard: payload.electoralWard,
    pollingUnit: payload.pollingUnit,
    currentAddress: payload.currentAddress,
    nationality: payload.nationality,
    tribe: payload.tribe,
    religion: payload.religion,
    education: payload.education,
    occupation: payload.occupation,
    organization: payload.organization,
    country,
    countryCode,
    region: payload.stateOfOrigin,
    profession: payload.occupation,
    whyJoin: "Signed up as a member.",
    status: "active",
    consentToDirectory: false,
    principlesAgreedAt: new Date(),
    referralCode,
    referredById,
  });

  await db.delete(signupChallenges).where(eq(signupChallenges.id, id));
  await createSession(created.id);

  let notice = "welcome";
  let extra = "";
  if (challenge.volunteerRoleSlug) {
    const assigned = await assignVolunteerRole({
      opportunitySlug: challenge.volunteerRoleSlug,
      userId: created.id,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.whatsapp,
      country,
    });
    if (assigned.ok) {
      notice = "role-assigned";
    } else if (assigned.reason === "full") {
      notice = "role-full";
      extra = assigned.suggestions
        .slice(0, 4)
        .map((role) => role.slug)
        .join(",");
    }
  }

  const membershipInbox = inboxFor(await getMailSettings(), "membershipNotifyTo");
  if (membershipInbox) {
    try {
      await sendTemplatedEmail({
        type: "application_received",
        to: membershipInbox,
        role: "membershipFrom",
        vars: { name: payload.fullName },
      });
    } catch {
      // Membership is already created; inbox notification must not block sign-in.
    }
  }

  revalidateContent(CACHE_TAGS.ambassadors, CACHE_TAGS.volunteers);
  revalidatePath("/dashboard");
  const next = extra ? `/dashboard?notice=${notice}&suggest=${encodeURIComponent(extra)}` : `/dashboard?notice=${notice}`;
  redirect(next);
}
