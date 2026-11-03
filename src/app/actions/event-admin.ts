"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { ensureEventEmailTemplates } from "@/lib/events/email-templates";
import {
  absoluteUrl,
  ensureRsvpToken,
  eventDisplayTitle,
  eventWhen,
  eventWhere,
  isValidEmail,
  rsvpPath,
} from "@/lib/events/portal";
import { sendDueEventReminders } from "@/lib/events/reminders";
import { sendTemplatedEmail } from "@/lib/email";
import { getRequestSiteUrl } from "@/lib/env";

function guestName(email: string) {
  const local = email.split("@")[0] ?? "";
  const name = local.replace(/[._-]+/g, " ").trim();
  return name || "there";
}

export async function sendEventInvites(formData: FormData) {
  const user = await requireAdmin("events");
  const eventId = String(formData.get("eventId") ?? "");
  const [event] = await getDb().select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) redirect("/admin/events");

  const emails = [
    ...new Set(
      String(formData.get("emails") ?? "")
        .split(/[\s,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter((value) => isValidEmail(value)),
    ),
  ];
  if (!emails.length) redirect(`/admin/events/${eventId}?inviteError=none`);

  const batch = emails.slice(0, 50);
  const token = await ensureRsvpToken(event.id, event.rsvpToken);
  const origin = await getRequestSiteUrl();
  const rsvpUrl = absoluteUrl(origin, rsvpPath(token));
  await ensureEventEmailTemplates();

  let sent = 0;
  let failed = 0;
  for (const email of batch) {
    try {
      await sendTemplatedEmail({
        type: "event_invite",
        to: email,
        role: "eventsFrom",
        vars: {
          name: guestName(email),
          eventTitle: eventDisplayTitle(event),
          eventDate: eventWhen(event),
          venue: eventWhere(event),
          rsvpUrl,
        },
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  await recordAudit({
    actorId: user.id,
    action: "event.invite",
    entityType: "event",
    entityId: event.id,
    metadata: { sent, failed, truncated: emails.length > batch.length },
  });
  const truncated = emails.length > batch.length ? "&inviteTruncated=1" : "";
  redirect(`/admin/events/${event.id}?invited=${sent}&inviteFailed=${failed}${truncated}`);
}

export async function markEventAttendance(formData: FormData) {
  const user = await requireAdmin("events");
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!id || !eventId) redirect("/admin/events");
  const [row] = await getDb()
    .select({ id: eventRegistrations.id, eventId: eventRegistrations.eventId })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.id, id))
    .limit(1);
  if (!row || row.eventId !== eventId) redirect(`/admin/events/${eventId}`);
  await getDb().update(eventRegistrations).set({ status: "attended" }).where(eq(eventRegistrations.id, id));
  await recordAudit({
    actorId: user.id,
    action: "event.attendance",
    entityType: "event_registration",
    entityId: id,
    metadata: { eventId },
  });
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}?attendance=saved`);
}

export async function sendDueReminders(formData: FormData) {
  const user = await requireAdmin("events");
  const eventId = String(formData.get("eventId") ?? "");
  const result = await sendDueEventReminders();
  await recordAudit({
    actorId: user.id,
    action: "event.reminders",
    entityType: "event",
    entityId: eventId || null,
    metadata: result,
  });
  revalidateContent(CACHE_TAGS.events);
  const target = eventId ? `/admin/events/${eventId}` : "/admin/events";
  redirect(`${target}?reminders=${result.sent}&reminderFailed=${result.failed}`);
}
