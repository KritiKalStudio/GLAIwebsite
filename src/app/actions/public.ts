"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { contactMessages, newsletterSubscribers } from "@/db/schema";
import { sendTemplatedEmail } from "@/lib/email";
import { getMailSettings, inboxFor } from "@/lib/mail";

export async function subscribeNewsletter(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return;
  await getDb()
    .insert(newsletterSubscribers)
    .values({ email })
    .onConflictDoNothing();
}

export async function submitContact(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const topic = String(formData.get("topic") ?? "general").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !email || !body) {
    return { ok: false, error: "Please include your name, email, and message." };
  }
  await getDb().insert(contactMessages).values({ name, email, topic, body });
  const inbox = inboxFor(await getMailSettings(), "contactTo");
  if (inbox) {
    try {
      await sendTemplatedEmail({
        type: "contact_message",
        to: inbox,
        role: "membershipFrom",
        replyTo: email,
        vars: { name, email, topic, body },
      });
    } catch {
      // The message is stored for staff even if email delivery fails.
    }
  }
  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function notifySandbox(type: string, to: string, vars: Record<string, string>) {
  await sendTemplatedEmail({ type, to, vars });
}
