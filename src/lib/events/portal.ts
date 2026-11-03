import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events, type EventAnswers, type EventCustomField } from "@/db/schema";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import { formatDate } from "@/lib/format";

export type RsvpResponse = "yes" | "no" | "maybe";

const FIELD_ID = /^[a-zA-Z0-9_-]{8,40}$/;

export function eventDisplayTitle(event: { title?: string | null }) {
  const title = event.title?.trim();
  return title || "Untitled event";
}

export function eventCardImage(event: { thumbnailUrl?: string | null; featuredImageUrl?: string | null }) {
  return event.thumbnailUrl || event.featuredImageUrl || null;
}

export function eventHeaderImage(event: { thumbnailUrl?: string | null; featuredImageUrl?: string | null }) {
  return event.featuredImageUrl || event.thumbnailUrl || null;
}

export function registrationIsOpen(event: { registrationOpen: boolean; registrationType: string }) {
  return event.registrationOpen && event.registrationType !== "closed";
}

export function eventWhen(event: { startsAt?: Date | string | null; timezone?: string | null }) {
  if (!event.startsAt) return "Date to be announced";
  const when = formatDate(event.startsAt, "d MMMM yyyy, HH:mm");
  return event.timezone ? `${when} (${event.timezone})` : when;
}

export function eventWhere(event: {
  isOnline: boolean;
  onlineUrl?: string | null;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  if (event.isOnline) {
    return event.onlineUrl ? `Online · ${event.onlineUrl}` : "Online";
  }
  const place = [event.venueName, event.address, event.city, event.country].filter(Boolean).join(", ");
  return place || "Venue to be announced";
}

export function rsvpLabel(value: string | null | undefined) {
  if (value === "yes") return "Attending";
  if (value === "no") return "Not attending";
  if (value === "maybe") return "Undecided";
  return "Registered";
}

export function responseSentence(value: RsvpResponse) {
  if (value === "yes") return "Yes, I will attend";
  if (value === "no") return "No, I cannot attend";
  return "I might attend";
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function newRsvpToken() {
  return randomBytes(18).toString("base64url");
}

export function slugifyEvent(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** A slug that can be one path segment without encoding spaces or punctuation. */
export function isPublicSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/**
 * The public link is always derived from the title. An existing safe link stays
 * put until the title changes. A hand-typed address is replaced.
 */
export async function resolveEventSlug(
  title: string,
  current?: { slug: string; title: string } | null,
  currentId?: string,
) {
  const fromTitle = slugifyEvent(title);
  if (!current) return uniqueEventSlug(fromTitle || title, currentId);
  if (!isPublicSlug(current.slug)) return uniqueEventSlug(fromTitle || title, currentId);
  const previous = slugifyEvent(current.title);
  if (previous && current.slug === previous && fromTitle && fromTitle !== current.slug) {
    return uniqueEventSlug(fromTitle, currentId);
  }
  return current.slug;
}

export async function uniqueEventSlug(base: string, currentId?: string) {
  const db = getDb();
  const root = slugifyEvent(base) || `event-${randomBytes(3).toString("hex")}`;
  let slug = root;
  for (let n = 2; n < 50; n += 1) {
    const [row] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
    if (!row || row.id === currentId) return slug;
    const suffix = `-${n}`;
    slug = `${root.slice(0, 80 - suffix.length)}${suffix}`;
  }
  return `${root.slice(0, 70)}-${randomBytes(3).toString("hex")}`;
}

export async function ensureRsvpToken(eventId: string, current: string | null | undefined) {
  if (current) return current;
  const token = newRsvpToken();
  await getDb()
    .update(events)
    .set({ rsvpToken: token, updatedAt: new Date() })
    .where(eq(events.id, eventId));
  revalidateContent(CACHE_TAGS.events);
  return token;
}

export function rsvpPath(token: string) {
  return `/rsvp/${token}`;
}

export function absoluteUrl(origin: string, path: string) {
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function parseCustomFields(raw: string): EventCustomField[] {
  let data: unknown;
  try {
    data = JSON.parse(raw || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const fields: EventCustomField[] = [];
  const seen = new Set<string>();
  for (const item of data.slice(0, 30)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? "").trim().slice(0, 120);
    if (!label) continue;
    const kind = row.kind === "choice" ? "choice" : "text";
    const multiple = kind === "choice" && row.multiple === true;
    const options =
      kind === "choice"
        ? [
            ...new Set(
              (Array.isArray(row.options) ? row.options : [])
                .map((option) => String(option).trim().slice(0, 80))
                .filter(Boolean),
            ),
          ].slice(0, 20)
        : [];
    let id = String(row.id ?? "").trim();
    if (!FIELD_ID.test(id) || seen.has(id)) id = randomBytes(8).toString("hex");
    seen.add(id);
    fields.push({
      id,
      label,
      kind,
      required: row.required === true,
      options,
      multiple,
    });
  }
  return fields;
}

export function parseReminderOffsets(formData: FormData) {
  const hours = new Set<number>();
  if (formData.get("remind168") === "on") hours.add(168);
  if (formData.get("remind24") === "on") hours.add(24);
  if (formData.get("remind2") === "on") hours.add(2);
  const custom = String(formData.get("remindCustom") ?? "");
  for (const part of custom.split(/[^0-9]+/)) {
    if (!part) continue;
    const value = Number(part);
    if (Number.isInteger(value) && value > 0 && value <= 24 * 90) hours.add(value);
  }
  return [...hours].sort((a, b) => b - a).slice(0, 8);
}

export function readRsvpResponse(formData: FormData): RsvpResponse | null {
  const value = String(formData.get("rsvp") ?? "");
  if (value === "yes" || value === "no" || value === "maybe") return value;
  return null;
}

export function readAnswers(formData: FormData, fields: EventCustomField[]) {
  const answers: EventAnswers = {};
  for (const field of fields) {
    if (field.kind === "text") {
      const value = String(formData.get(`field:${field.id}`) ?? "").trim().slice(0, 2000);
      if (field.required && !value) return { error: `Please complete “${field.label}”.` };
      if (value) answers[field.id] = value;
      continue;
    }
    if (field.multiple) {
      const values = [
        ...new Set(
          formData
            .getAll(`field:${field.id}`)
            .map((value) => String(value).trim())
            .filter((value) => field.options.includes(value)),
        ),
      ];
      if (field.required && values.length === 0) return { error: `Please choose “${field.label}”.` };
      if (values.length) answers[field.id] = values;
      continue;
    }
    const value = String(formData.get(`field:${field.id}`) ?? "").trim();
    if (field.required && !value) return { error: `Please choose “${field.label}”.` };
    if (value && !field.options.includes(value)) {
      return { error: `Choose a listed option for “${field.label}”.` };
    }
    if (value) answers[field.id] = value;
  }
  return { answers };
}

export function answersSummary(fields: EventCustomField[], answers: EventAnswers) {
  return fields
    .map((field) => {
      const value = answers[field.id];
      if (!value || (Array.isArray(value) && value.length === 0)) return "";
      const text = Array.isArray(value) ? value.join(", ") : value;
      return `${field.label}: ${text}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function holdsSeat(row: { status: string; rsvpResponse?: string | null }) {
  if (row.rsvpResponse === "no" || row.status === "cancelled" || row.status === "waitlist") return false;
  return row.status === "registered" || row.status === "attended";
}

export function parseOptionalDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
