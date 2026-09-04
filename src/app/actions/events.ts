"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { countEventRegistrations } from "@/lib/content/events";
import { encryptField } from "@/lib/crypto";
import { sendTemplatedEmail } from "@/lib/email";
import { formatDate } from "@/lib/format";

export async function registerForEvent(
  _prev: { error?: string; ok?: boolean; waitlist?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; waitlist?: boolean }> {
  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!eventId || !name || !email) {
    return { error: "Please complete name and email." };
  }

  const [event] = await getDb().select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event || event.status !== "published") return { error: "This event is not open." };
  if (event.registrationType === "closed") {
    return { error: "Registration for this event is closed." };
  }

  const existing = await getDb()
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.email, email)))
    .limit(1);
  if (existing[0] && existing[0].status !== "cancelled") {
    return { error: "This email is already registered." };
  }

  const counts = await countEventRegistrations(eventId);
  const isFull = event.capacity != null && counts.registered >= event.capacity;
  const status = isFull ? "waitlist" : "registered";

  await getDb().insert(eventRegistrations).values({
    eventId,
    name,
    email,
    phone: encryptField(phone || null),
    status,
  });

  await sendTemplatedEmail({
    type: "event_registration",
    to: email,
    vars: {
      name,
      eventTitle: event.title,
      eventDate: formatDate(event.startsAt, "d MMMM yyyy, HH:mm"),
    },
  });
  revalidatePath(`/events/${event.slug}`);
  return { ok: true, waitlist: isFull };
}
