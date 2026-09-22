"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { getDb } from "@/db";
import {
  ambassadorTrainingProgress,
  ambassadors,
  certificates,
  trainingModules,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { encryptField } from "@/lib/crypto";
import { COUNTRIES } from "@/lib/countries";
import { resolveMembershipPlace } from "@/lib/nigeria-gazetteer";
import { sendTemplatedEmail } from "@/lib/email";
import { getRequestSiteUrl } from "@/lib/env";
import { resolveReligion } from "@/lib/religions";
import { randomBytes } from "node:crypto";
import { users } from "@/db/schema";

export async function applyAmbassador(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const profession = String(formData.get("profession") ?? "").trim();
  const whyJoin = String(formData.get("whyJoin") ?? "").trim();
  const principles = formData.get("principles") === "on";
  const areasOfInterest = formData.getAll("areasOfInterest").map(String);
  const volunteerInterests = formData.getAll("volunteerInterests").map(String);
  const country = COUNTRIES.find((row) => row.code === countryCode)?.name ?? countryCode;

  if (!fullName || !email || !countryCode || !whyJoin) {
    return { error: "Please complete the required fields." };
  }
  if (!principles) {
    return { error: "You must agree to the Ambassador principles to apply." };
  }

  const existing = await getDb()
    .select({ id: ambassadors.id })
    .from(ambassadors)
    .where(eq(ambassadors.email, email))
    .limit(1);
  if (existing[0]) {
    return { error: "An application already exists for this email address." };
  }

  const [row] = await getDb()
    .insert(ambassadors)
    .values({
      fullName,
      email,
      phone: encryptField(phone || null),
      country,
      countryCode,
      region: region || null,
      profession: profession || null,
      areasOfInterest,
      whyJoin,
      volunteerInterests,
      status: "applied",
      consentToDirectory: false,
      principlesAgreedAt: new Date(),
    })
    .returning();

  await sendTemplatedEmail({
    type: "application_received",
    to: email,
    vars: { name: fullName },
  });
  await recordAudit({
    action: "ambassador.apply",
    entityType: "ambassador",
    entityId: row.id,
    metadata: { email },
  });
  revalidatePath("/admin/membership");
  return { ok: true };
}

export async function toggleDirectoryConsent(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.ambassadorId) return;
  const consent = formData.get("consent") === "on";
  await getDb()
    .update(ambassadors)
    .set({ consentToDirectory: consent, updatedAt: new Date() })
    .where(eq(ambassadors.id, user.ambassadorId));
  revalidateContent(CACHE_TAGS.ambassadors);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/love-ambassadors/network");
  redirect("/dashboard/settings?notice=consent");
}

export async function updateAmbassadorProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.ambassadorId) return;
  const countryName = String(formData.get("country") ?? "").trim();
  const countryMatch = COUNTRIES.find(
    (row) => row.name.toLowerCase() === countryName.toLowerCase() || row.code.toLowerCase() === countryName.toLowerCase(),
  );
  const religion = resolveReligion(String(formData.get("religion") ?? ""), String(formData.get("religionOther") ?? ""));
  const place = await resolveMembershipPlace({
    stateOfOrigin: String(formData.get("stateOfOrigin") ?? ""),
    localGovernment: String(formData.get("localGovernment") ?? ""),
    electoralWard: String(formData.get("electoralWard") ?? ""),
    pollingUnit: String(formData.get("pollingUnit") ?? ""),
  });
  if (!place.ok) return;
  await getDb()
    .update(ambassadors)
    .set({
      fullName: String(formData.get("fullName") ?? user.name),
      phone: encryptField(String(formData.get("whatsapp") ?? formData.get("phone") ?? "") || null),
      whatsapp: encryptField(String(formData.get("whatsapp") ?? "") || null),
      age: Number(formData.get("age") || 0) || null,
      stateOfOrigin: place.value.stateOfOrigin || null,
      localGovernment: place.value.localGovernment || null,
      geoPoliticalZone: place.value.geoPoliticalZone,
      electoralWard: place.value.electoralWard,
      pollingUnit: place.value.pollingUnit,
      currentAddress: String(formData.get("currentAddress") ?? "") || null,
      nationality: String(formData.get("nationality") ?? "") || null,
      tribe: String(formData.get("tribe") ?? "") || null,
      religion: religion || null,
      education: String(formData.get("education") ?? "") || null,
      occupation: String(formData.get("occupation") ?? "") || null,
      organization: String(formData.get("organization") ?? "") || null,
      ...(countryName
        ? {
            country: countryMatch?.name || countryName,
            countryCode: countryMatch?.code ?? "ZZ",
          }
        : {}),
      region: String(formData.get("stateOfOrigin") ?? "") || null,
      profession: String(formData.get("occupation") ?? "") || null,
      updatedAt: new Date(),
    })
    .where(eq(ambassadors.id, user.ambassadorId));
  revalidateContent(CACHE_TAGS.ambassadors);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/love-ambassadors/network");
  redirect("/dashboard/profile?notice=saved");
}

export async function completeTrainingModule(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.ambassadorId) return;
  const moduleId = String(formData.get("moduleId") ?? "");
  if (!moduleId) return;
  await getDb()
    .insert(ambassadorTrainingProgress)
    .values({ ambassadorId: user.ambassadorId, moduleId })
    .onConflictDoNothing();
  revalidatePath("/dashboard", "layout");
}

export async function approveAmbassador(formData: FormData) {
  const actor = await getSessionUser();
  if (!actor || (actor.roleSlug !== "admin" && !actor.permissions.membership)) {
    return;
  }
  const id = String(formData.get("id") ?? "");
  const [ambassador] = await getDb()
    .select()
    .from(ambassadors)
    .where(eq(ambassadors.id, id))
    .limit(1);
  if (!ambassador) return;

  let userId = ambassador.userId;
  if (!userId) {
    const password = randomBytes(10).toString("base64url");
    const [created] = await getDb()
      .insert(users)
      .values({
        email: ambassador.email,
        name: ambassador.fullName,
        passwordHash: await hashPassword(password),
        emailVerifiedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { isActive: true, updatedAt: new Date() },
      })
      .returning();
    userId = created.id;
  }

  await getDb()
    .update(ambassadors)
    .set({
      status: "active",
      userId,
      reviewedAt: new Date(),
      reviewedById: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(ambassadors.id, id));

  const token = randomBytes(32).toString("hex");
  const { passwordResetTokens } = await import("@/db/schema");
  const { hashToken } = await import("@/lib/auth");
  await getDb().insert(passwordResetTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
  });

  await sendTemplatedEmail({
    type: "application_approved",
    to: ambassador.email,
    vars: {
      name: ambassador.fullName,
      resetUrl: `${await getRequestSiteUrl()}/reset-password?token=${token}`,
    },
  });
  await sendTemplatedEmail({
    type: "welcome_glai",
    to: ambassador.email,
    vars: { name: ambassador.fullName },
  });
  await recordAudit({
    actorId: actor.id,
    action: "ambassador.approve",
    entityType: "ambassador",
    entityId: id,
  });
  revalidateContent(CACHE_TAGS.ambassadors);
  revalidatePath("/admin/membership");
}

export async function rejectAmbassador(formData: FormData) {
  const actor = await getSessionUser();
  if (!actor || (actor.roleSlug !== "admin" && !actor.permissions.membership)) {
    return;
  }
  const id = String(formData.get("id") ?? "");
  await getDb()
    .update(ambassadors)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedById: actor.id,
      reviewNotes: String(formData.get("reviewNotes") ?? ""),
      updatedAt: new Date(),
    })
    .where(eq(ambassadors.id, id));
  await recordAudit({
    actorId: actor.id,
    action: "ambassador.reject",
    entityType: "ambassador",
    entityId: id,
  });
  revalidateContent(CACHE_TAGS.ambassadors);
  revalidatePath("/admin/membership");
}

export async function issueCertificate(formData: FormData) {
  const actor = await getSessionUser();
  if (!actor || (actor.roleSlug !== "admin" && !actor.permissions.membership)) {
    return;
  }
  const ambassadorId = String(formData.get("ambassadorId") ?? "");
  const title = String(formData.get("title") ?? "Love Ambassador — Foundations");
  const [ambassador] = await getDb()
    .select()
    .from(ambassadors)
    .where(eq(ambassadors.id, ambassadorId))
    .limit(1);
  if (!ambassador) return;
  await getDb().insert(certificates).values({ ambassadorId, title });
  await sendTemplatedEmail({
    type: "certificate_issued",
    to: ambassador.email,
    vars: { name: ambassador.fullName, certificateTitle: title },
  });
  await recordAudit({
    actorId: actor.id,
    action: "certificate.issue",
    entityType: "certificate",
    entityId: ambassadorId,
    metadata: { title },
  });
  revalidatePath("/admin/membership");
}

export async function listTrainingModules() {
  return getDb().select().from(trainingModules);
}
