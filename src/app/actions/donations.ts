"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { ambassadors, campaigns, donations, programs, recurringDonations, volunteerApplications } from "@/db/schema";
import { getSessionUser, hashToken } from "@/lib/auth";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { encryptField } from "@/lib/crypto";
import { sendTemplatedEmail } from "@/lib/email";
import { getRequestSiteUrl } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { getMailSettings, inboxFor } from "@/lib/mail";
import { revalidatePath } from "next/cache";

export async function createSandboxDonation(formData: FormData) {
  const campaignSlug = String(formData.get("campaignSlug") ?? "general-fund");
  const amount = String(formData.get("amount") ?? "").trim();
  const custom = String(formData.get("customAmount") ?? "").trim();
  const currency = String(formData.get("currency") ?? "NGN");
  const frequency = formData.get("frequency") === "monthly" ? "monthly" : "one_time";
  const anonymous = formData.get("anonymous") === "on";
  const donorName = String(formData.get("donorName") ?? "").trim() || (anonymous ? "Anonymous" : "Supporter");
  const donorEmail = String(formData.get("donorEmail") ?? "").trim().toLowerCase() || "undisclosed@glai.local";
  const donorPhone = String(formData.get("donorPhone") ?? "").trim();
  const isAnonymous = anonymous ? "true" : "false";

  const numeric = Number(custom || amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    redirect("/donate?error=invalid");
  }

  const [campaign] = await getDb()
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, campaignSlug))
    .limit(1);

  const origin = await getRequestSiteUrl();
  const processorRef = `sandbox_${randomBytes(8).toString("hex")}`;
  const [donation] = await getDb()
    .insert(donations)
    .values({
      campaignId: campaign?.id,
      amount: String(numeric),
      currency,
      frequency,
      donorName,
      donorEmail,
      donorPhone: encryptField(donorPhone || null),
      isAnonymous,
      processor: "sandbox",
      processorRef,
      status: "completed",
      receiptUrl: `${origin}/donate/receipt/${processorRef}`,
    })
    .returning();

  let manageToken = "";
  if (frequency === "monthly") {
    manageToken = randomBytes(24).toString("hex");
    await getDb().insert(recurringDonations).values({
      donationId: donation.id,
      donorEmail,
      manageTokenHash: hashToken(manageToken),
      amount: String(numeric),
      currency,
      status: "active",
      nextChargeAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      processorRef,
    });
  }

  const receiptUrl = donation.receiptUrl ?? `${origin}/donate/receipt/${processorRef}`;
  try {
    await sendTemplatedEmail({
      type: "donation_confirmation",
      to: donorEmail,
      role: "donationsFrom",
      vars: {
        name: donorName,
        amount: formatMoney(numeric, currency),
        currency,
        frequency,
        receiptUrl,
      },
    });
    await sendTemplatedEmail({
      type: "donation_receipt",
      to: donorEmail,
      role: "donationsFrom",
      vars: {
        name: donorName,
        amount: formatMoney(numeric, currency),
        currency,
        receiptId: processorRef,
        receiptUrl,
      },
    });
    const notify = inboxFor(await getMailSettings(), "donationsNotifyTo");
    if (notify) {
      await sendTemplatedEmail({
        type: "donation_confirmation",
        to: notify,
        role: "donationsFrom",
        vars: {
          name: donorName,
          amount: formatMoney(numeric, currency),
          currency,
          frequency,
          receiptUrl,
        },
      });
    }
  } catch {
    // Gift is recorded even if mail delivery is not configured yet.
  }

  redirect(`/donate/receipt/${processorRef}${manageToken ? `?manage=${manageToken}` : ""}`);
}

const PROCESSORS = new Set(["paystack", "stripe", "gofundme", "patreon", "bank_transfer", "sandbox"]);

export async function createProgramDonation(formData: FormData) {
  const programSlug = String(formData.get("programSlug") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").trim();
  const custom = String(formData.get("customAmount") ?? "").trim();
  const currency = String(formData.get("currency") ?? "NGN");
  const processorRaw = String(formData.get("processor") ?? "paystack");
  const processor = PROCESSORS.has(processorRaw) ? processorRaw : "paystack";
  const anonymous = formData.get("anonymous") === "on";
  const numeric = Number(custom || amount);
  if (!programSlug || !Number.isFinite(numeric) || numeric <= 0) {
    redirect(`/our-work/${programSlug || ""}?error=invalid`);
  }

  const user = await getSessionUser();
  const db = getDb();
  const [program] = await db.select().from(programs).where(eq(programs.slug, programSlug)).limit(1);
  if (!program) redirect("/donate");

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.programId, program.id)).limit(1);
  const [profile] = user?.ambassadorId
    ? await db.select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1)
    : [];

  let donorName = String(formData.get("donorName") ?? "").trim();
  let donorEmail = String(formData.get("donorEmail") ?? "").trim().toLowerCase();
  let donorPhone = String(formData.get("donorPhone") ?? "").trim();
  let donorOrganization = String(formData.get("donorOrganization") ?? "").trim();
  const isMember = Boolean(user && !user.roleSlug);

  if (isMember && profile) {
    if (!anonymous) {
      donorName = profile.fullName;
      donorEmail = user!.email;
      donorPhone = "";
      donorOrganization = profile.organization ?? "";
    }
  }

  if (anonymous) {
    donorName = donorName || "Anonymous";
    donorEmail = donorEmail || "anonymous@glai.local";
  } else {
    donorName = donorName || "Supporter";
    donorEmail = donorEmail || "undisclosed@glai.local";
  }

  const processorRef = `${processor}_${randomBytes(8).toString("hex")}`;
  const liveGateway = processor === "paystack" || processor === "stripe";
  await db.insert(donations).values({
    campaignId: campaign?.id,
    programId: program.id,
    userId: isMember ? user!.id : null,
    amount: String(numeric),
    currency,
    frequency: "one_time",
    donorName,
    donorEmail,
    donorPhone: encryptField(donorPhone || null),
    donorOrganization: donorOrganization || null,
    isAnonymous: anonymous ? "true" : "false",
    isMember: isMember && !anonymous ? "true" : "false",
    processor,
    processorRef,
    status: liveGateway ? "pending" : processor === "bank_transfer" ? "pending" : "pending",
    receiptUrl: `${await getRequestSiteUrl()}/donate/receipt/${processorRef}`,
  });

  revalidateContent(CACHE_TAGS.donations, CACHE_TAGS.programs);
  revalidatePath("/donate");
  revalidatePath(`/our-work/${program.slug}`);
  revalidatePath("/admin/donations");
  redirect(`/donate/receipt/${processorRef}`);
}

export async function updateRecurringDonation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const status = String(formData.get("status") ?? "") as "active" | "paused" | "cancelled";
  if (!["active", "paused", "cancelled"].includes(status)) return;
  const { hashToken: hash } = await import("@/lib/auth");
  const [row] = await getDb()
    .select()
    .from(recurringDonations)
    .where(eq(recurringDonations.manageTokenHash, hash(token)))
    .limit(1);
  if (!row) return;
  await getDb()
    .update(recurringDonations)
    .set({ status, updatedAt: new Date() })
    .where(eq(recurringDonations.id, row.id));
  revalidatePath(`/donate/manage/${token}`);
}

export async function applyVolunteer(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const opportunityId = String(formData.get("opportunityId") ?? "") || null;
  const interests = formData.getAll("interests").map(String);
  if (!fullName || !email || !country || !message) {
    return { error: "Please complete the required fields." };
  }
  await getDb().insert(volunteerApplications).values({
    opportunityId,
    fullName,
    email,
    phone: encryptField(phone || null),
    country,
    message,
    interests,
  });
  await sendTemplatedEmail({
    type: "volunteer_received",
    to: email,
    role: "volunteersFrom",
    vars: { name: fullName },
  });
  const notify = inboxFor(await getMailSettings(), "volunteersNotifyTo");
  if (notify) {
    try {
      await sendTemplatedEmail({
        type: "volunteer_received",
        to: notify,
        role: "volunteersFrom",
        vars: { name: fullName },
      });
    } catch {
      // Application is stored even if staff notification fails.
    }
  }
  revalidatePath("/admin/volunteers");
  return { ok: true };
}
