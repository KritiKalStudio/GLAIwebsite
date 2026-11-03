import { cache } from "react";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { slugifyEvent } from "@/lib/events/portal";
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

function eventStartMs(value: Date | string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export async function getUpcomingEvents() {
  const now = Date.now();
  return (await getPublishedEvents())
    .filter((event) => {
      const start = eventStartMs(event.startsAt);
      return start != null && start >= now;
    })
    .sort((a, b) => eventStartMs(a.startsAt)! - eventStartMs(b.startsAt)!);
}

export async function getUndatedEvents() {
  return (await getPublishedEvents()).filter((event) => eventStartMs(event.startsAt) == null);
}

export async function getPastEvents() {
  const now = Date.now();
  return (await getPublishedEvents())
    .filter((event) => {
      const start = eventStartMs(event.startsAt);
      return start != null && start < now;
    })
    .sort((a, b) => eventStartMs(b.startsAt)! - eventStartMs(a.startsAt)!);
}

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

/**
 * Direct read, not the shared data cache. A stale cached miss was rendering
 * the public event page as 404 while the events list still showed the event.
 */
export const getPublishedEvent = cache(async (slug: string) => {
  const wanted = decodeSlug(slug);
  const db = getDb();
  const [exact] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, wanted), eq(events.status, "published")))
    .limit(1);
  if (exact) return exact;
  const normalized = slugifyEvent(wanted);
  if (!normalized || normalized === wanted) return null;
  const rows = await db.select().from(events).where(eq(events.status, "published"));
  return rows.find((row) => row.slug === normalized || slugifyEvent(row.slug) === normalized) ?? null;
});

export const getEventByRsvpToken = cache(async (token: string) => {
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.rsvpToken, token), ne(events.status, "archived")))
    .limit(1);
  return event ?? null;
});

export async function listEventsForAdmin() {
  const db = getDb();
  const [rows, registrations] = await Promise.all([
    db.select().from(events).orderBy(desc(events.startsAt)),
    db
      .select({ eventId: eventRegistrations.eventId })
      .from(eventRegistrations)
      .orderBy(asc(eventRegistrations.createdAt)),
  ]);
  const counts = new Map<string, number>();
  for (const row of registrations) counts.set(row.eventId, (counts.get(row.eventId) ?? 0) + 1);
  return rows.map((event) => ({ ...event, registrationCount: counts.get(event.id) ?? 0 }));
}

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
