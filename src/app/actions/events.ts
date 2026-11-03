"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { encryptField } from "@/lib/crypto";
import { ensureEventEmailTemplates } from "@/lib/events/email-templates";
import {
  absoluteUrl,
  answersSummary,
  ensureRsvpToken,
  eventDisplayTitle,
  eventWhen,
  eventWhere,
  holdsSeat,
  isValidEmail,
  readAnswers,
  readRsvpResponse,
  registrationIsOpen,
  responseSentence,
  rsvpPath,
} from "@/lib/events/portal";
import { sendTemplatedEmail } from "@/lib/email";
import { getRequestSiteUrl } from "@/lib/env";

export async function registerForEvent(
  _prev: {
    error?: string;
    ok?: boolean;
    waitlist?: boolean;
    updated?: boolean;
    emailFailed?: boolean;
    response?: "yes" | "no" | "maybe";
  } | null,
  formData: FormData,
): Promise<{
  error?: string;
  ok?: boolean;
  waitlist?: boolean;
  updated?: boolean;
  emailFailed?: boolean;
  response?: "yes" | "no" | "maybe";
}> {
  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const response = readRsvpResponse(formData);
  if (!eventId || !name || !email) return { error: "Please complete name and email." };
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  if (!response) return { error: "Please say whether you intend to attend." };

  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event || event.status === "archived") return { error: "This event is not open." };
  if (!registrationIsOpen(event)) return { error: "Registration for this event is closed." };

  const parsed = readAnswers(formData, event.customFields ?? []);
  if (parsed.error || !parsed.answers) return { error: parsed.error ?? "Please check the form." };

  const existingRows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));
  const existing = existingRows.find((row) => row.email === email);
  const seats = existingRows.filter((row) => row.email !== email && holdsSeat(row)).length;
  const wantsSeat = response !== "no";
  const isFull = event.capacity != null && wantsSeat && seats >= event.capacity;

  let status: "registered" | "waitlist" | "cancelled" | "attended" = "registered";
  if (response === "no") status = "cancelled";
  else if (existing?.status === "attended") status = "attended";
  else if (isFull) status = "waitlist";

  const values = {
    name,
    email,
    phone: encryptField(phone || null),
    status,
    rsvpResponse: response,
    answers: parsed.answers,
  };

  if (existing) {
    await db.update(eventRegistrations).set(values).where(eq(eventRegistrations.id, existing.id));
  } else {
    await db.insert(eventRegistrations).values({ eventId, ...values });
  }

  const token = await ensureRsvpToken(event.id, event.rsvpToken);
  const origin = await getRequestSiteUrl();
  let emailFailed = false;
  try {
    await ensureEventEmailTemplates();
    await sendTemplatedEmail({
      type: "event_registration",
      to: email,
      role: "eventsFrom",
      vars: {
        name,
        eventTitle: eventDisplayTitle(event),
        eventDate: eventWhen(event),
        venue: eventWhere(event),
        response: responseSentence(response),
        details: answersSummary(event.customFields ?? [], parsed.answers),
        rsvpUrl: absoluteUrl(origin, rsvpPath(token)),
      },
    });
  } catch {
    emailFailed = true;
  }

  revalidatePath(`/events/${event.slug}`);
  revalidatePath(rsvpPath(token));
  return { ok: true, waitlist: status === "waitlist", updated: Boolean(existing), emailFailed, response };
}
