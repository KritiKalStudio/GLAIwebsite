"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { campaigns, donations, recurringDonations, volunteerApplications } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { encryptField } from "@/lib/crypto";
import { sendTemplatedEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { revalidatePath } from "next/cache";

export async function createSandboxDonation(formData: FormData) {
  const campaignSlug = String(formData.get("campaignSlug") ?? "general-fund");
  const amount = String(formData.get("amount") ?? "").trim();
  const custom = String(formData.get("customAmount") ?? "").trim();
  const currency = String(formData.get("currency") ?? "NGN");
  const frequency = formData.get("frequency") === "monthly" ? "monthly" : "one_time";
  const donorName = String(formData.get("donorName") ?? "").trim();
  const donorEmail = String(formData.get("donorEmail") ?? "").trim().toLowerCase();
  const donorPhone = String(formData.get("donorPhone") ?? "").trim();
  const isAnonymous = formData.get("anonymous") === "on" ? "true" : "false";

  const numeric = Number(custom || amount);
  if (!donorName || !donorEmail || !Number.isFinite(numeric) || numeric <= 0) {
    redirect("/donate?error=invalid");
  }

  const [campaign] = await getDb()
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, campaignSlug))
    .limit(1);

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
      receiptUrl: `${getSiteUrl()}/donate/receipt/${processorRef}`,
    })
    .returning();

  let manageUrl = "";
  if (frequency === "monthly") {
    const token = randomBytes(24).toString("hex");
    await getDb().insert(recurringDonations).values({
      donationId: donation.id,
      donorEmail,
      manageTokenHash: hashToken(token),
      amount: String(numeric),
      currency,
      status: "active",
      nextChargeAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      processorRef,
    });
    manageUrl = `${getSiteUrl()}/donate/manage/${token}`;
  }

  await sendTemplatedEmail({
    type: "donation_confirmation",
    to: donorEmail,
    vars: {
      name: donorName,
      amount: formatMoney(numeric, currency),
      currency,
      frequency,
      receiptUrl: donation.receiptUrl ?? "",
    },
  });
  await sendTemplatedEmail({
    type: "donation_receipt",
    to: donorEmail,
    vars: {
      name: donorName,
      amount: formatMoney(numeric, currency),
      currency,
      receiptId: processorRef,
      receiptUrl: donation.receiptUrl ?? "",
    },
  });

  redirect(
    `/donate/receipt/${processorRef}${manageUrl ? `?manage=${encodeURIComponent(manageUrl)}` : ""}`,
  );
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
    vars: { name: fullName },
  });
  revalidatePath("/admin/volunteers");
  return { ok: true };
}
