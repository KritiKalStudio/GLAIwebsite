import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";

export async function getPublishedEvents() {
  const db = getDb();
  const locale = await getRequestLocale();
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), eq(events.locale, locale)))
    .orderBy(desc(events.startsAt));
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), eq(events.locale, fallback)))
    .orderBy(desc(events.startsAt));
}

export async function getUpcomingEvents() {
  const db = getDb();
  const locale = await getRequestLocale();
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), eq(events.locale, locale), gte(events.startsAt, new Date())))
    .orderBy(events.startsAt);
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), eq(events.locale, fallback), gte(events.startsAt, new Date())))
    .orderBy(events.startsAt);
}

export async function getPastEvents() {
  const db = getDb();
  const locale = await getRequestLocale();
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), eq(events.locale, locale), lt(events.startsAt, new Date())))
    .orderBy(desc(events.startsAt));
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), eq(events.locale, fallback), lt(events.startsAt, new Date())))
    .orderBy(desc(events.startsAt));
}

export async function getPublishedEvent(slug: string) {
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.status, "published")))
    .limit(1);
  return event ?? null;
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
