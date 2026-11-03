import { and, eq, gt, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { eventRegistrations, eventReminderSends, events } from "@/db/schema";
import { ensureEventEmailTemplates } from "@/lib/events/email-templates";
import {
  absoluteUrl,
  ensureRsvpToken,
  eventDisplayTitle,
  eventWhen,
  eventWhere,
  rsvpPath,
} from "@/lib/events/portal";
import { sendTemplatedEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";

const MAX_SENDS = 200;

export async function sendDueEventReminders() {
  await ensureEventEmailTemplates();
  const db = getDb();
  const now = new Date();
  const upcoming = await db
    .select()
    .from(events)
    .where(and(gt(events.startsAt, now), inArray(events.status, ["draft", "preview", "published"])));

  let sent = 0;
  let failed = 0;
  const origin = getSiteUrl();

  for (const event of upcoming) {
    if (sent + failed >= MAX_SENDS) break;
    if (!event.startsAt) continue;
    const offsets = (event.reminderOffsetsHours ?? []).filter((hours) => Number.isInteger(hours) && hours > 0);
    const dueOffsets = offsets.filter((hours) => {
      const sendAt = event.startsAt!.getTime() - hours * 60 * 60 * 1000;
      return now.getTime() >= sendAt;
    });
    if (!dueOffsets.length) continue;
    const token = await ensureRsvpToken(event.id, event.rsvpToken);
    if (!token) continue;

    const guests = await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, event.id));
    const remindable = guests.filter(
      (guest) => guest.rsvpResponse !== "no" && guest.status !== "cancelled",
    );

    for (const guest of remindable) {
      for (const offsetHours of dueOffsets) {
        if (sent + failed >= MAX_SENDS) break;
        const [claimed] = await db
          .insert(eventReminderSends)
          .values({ eventId: event.id, registrationId: guest.id, offsetHours })
          .onConflictDoNothing()
          .returning({ id: eventReminderSends.id });
        if (!claimed) continue;
        try {
          await sendTemplatedEmail({
            type: "event_reminder",
            to: guest.email,
            role: "eventsFrom",
            vars: {
              name: guest.name,
              eventTitle: eventDisplayTitle(event),
              eventDate: eventWhen(event),
              venue: eventWhere(event),
              rsvpUrl: absoluteUrl(origin, rsvpPath(token)),
            },
          });
          sent += 1;
        } catch {
          failed += 1;
          await db.delete(eventReminderSends).where(eq(eventReminderSends.id, claimed.id));
        }
      }
    }
  }

  return { sent, failed };
}
