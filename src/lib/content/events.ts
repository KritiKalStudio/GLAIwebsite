import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";

const loadPublishedEvents = cached("published-events", [CACHE_TAGS.events], async () => {
  const db = getDb();
  return db.select().from(events).where(eq(events.status, "published")).orderBy(desc(events.startsAt));
});

export async function getPublishedEvents() {
  const locale = await getRequestLocale();
  const rows = await loadPublishedEvents();
  const localized = rows.filter((event) => event.locale === locale);
  if (localized.length) return localized;
  const fallback = await getDefaultLocale();
  const fallbackRows = rows.filter((event) => event.locale === fallback);
  return fallbackRows.length ? fallbackRows : rows;
}

function eventStartMs(value: Date | string) {
  return new Date(value).getTime();
}

export async function getUpcomingEvents() {
  const now = Date.now();
  return (await getPublishedEvents())
    .filter((event) => eventStartMs(event.startsAt) >= now)
    .sort((a, b) => eventStartMs(a.startsAt) - eventStartMs(b.startsAt));
}

export async function getPastEvents() {
  const now = Date.now();
  return (await getPublishedEvents())
    .filter((event) => eventStartMs(event.startsAt) < now)
    .sort((a, b) => eventStartMs(b.startsAt) - eventStartMs(a.startsAt));
}

export const getPublishedEvent = cached("published-event", [CACHE_TAGS.events], async (slug: string) => {
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.status, "published")))
    .limit(1);
  return event ?? null;
});

export async function countEventRegistrations(eventId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: eventRegistrations.id, status: eventRegistrations.status })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));
  return {
    registered: rows.filter((row) => row.status === "registered" || row.status === "attended").length,
    waitlist: rows.filter((row) => row.status === "waitlist").length,
  };
}
