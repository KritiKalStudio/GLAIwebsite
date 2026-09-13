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
import { sendTemplatedEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
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
      type: "application_approved",
      to: user.email,
      vars: {
        name: user.name,
        resetUrl: `${getSiteUrl()}/reset-password?token=${token}`,
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

function countryFromNationality(nationality: string) {
  const match = COUNTRIES.find(
    (row) => row.name.toLowerCase() === nationality.toLowerCase() || row.code.toLowerCase() === nationality.toLowerCase(),
  );
  return { country: match?.name ?? nationality, countryCode: match?.code ?? "ZZ" };
}

export async function startSignupAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const payload: SignupPayload = {
    fullName: field(formData, "fullName"),
    email: field(formData, "email").toLowerCase(),
    whatsapp: field(formData, "whatsapp"),
    age: Number(field(formData, "age")),
    stateOfOrigin: field(formData, "stateOfOrigin"),
    localGovernment: field(formData, "localGovernment"),
    currentAddress: field(formData, "currentAddress"),
    nationality: field(formData, "nationality"),
    tribe: field(formData, "tribe"),
    religion: field(formData, "religion"),
    education: field(formData, "education"),
    occupation: field(formData, "occupation"),
    organization: field(formData, "organization"),
  };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const roleSlug = field(formData, "role") || null;

  const missing = Object.entries(payload).filter(([key, value]) => {
    if (key === "age") return !Number.isFinite(payload.age) || payload.age < 13 || payload.age > 120;
    return !String(value).trim();
  });
  if (missing.length) {
    return { error: "Please complete every field on the form." };
  }
  if (!payload.email.includes("@")) return { error: "Enter a valid email address." };
  const whatsapp = normalizeWhatsapp(payload.whatsapp);
  if (!whatsapp) return { error: "Enter a valid WhatsApp number with country code, e.g. +2348012345678." };
  payload.whatsapp = whatsapp;
  if (password.length < 10) return { error: "Choose a password of at least 10 characters." };
  if (password !== confirm) return { error: "The password confirmation does not match." };

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
    const result = await sendWhatsappCode(whatsapp, code);
    if (result.skipped) hint = code;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not send the WhatsApp code. Check the number and try again." };
  }

  const confirmUrl = new URL("/signup/confirm", getSiteUrl());
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
  if (!id || code.length !== 4) return { error: "Enter the 4-digit code sent to WhatsApp." };

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
    return { error: "That code did not match. Check WhatsApp and try again." };
  }

  const payload = challenge.payload;
  const { country, countryCode } = countryFromNationality(payload.nationality);
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

  revalidateContent(CACHE_TAGS.ambassadors, CACHE_TAGS.volunteers);
  revalidatePath("/dashboard");
  const next = extra ? `/dashboard?notice=${notice}&suggest=${encodeURIComponent(extra)}` : `/dashboard?notice=${notice}`;
  redirect(next);
}
