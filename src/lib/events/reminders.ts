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

/** 07:00 UTC, which is 08:00 in Lagos. Must match the daily cron in vercel.json. */
export const DAILY_REMINDER_HOUR_UTC = 7;

/** The next 07:00 UTC. After that hour, this is tomorrow, so the morning job covers the coming day. */
export function nextDailyReminderRun(now = new Date()) {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(DAILY_REMINDER_HOUR_UTC);
  if (next.getTime() < now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function sendDueEventReminders(options?: { until?: Date }) {
  await ensureEventEmailTemplates();
  const db = getDb();
  const now = new Date();
  const until = options?.until ?? now;
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
      // Day-scale reminders can go on the morning run before their exact time.
      // Shorter reminders, such as 2 hours, wait until that time has passed.
      const deadline = hours >= 24 ? until.getTime() : now.getTime();
      return deadline >= sendAt;
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
