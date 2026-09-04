import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stories } from "@/db/schema";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";

export type StoryCategory =
  | "stories_of_change"
  | "news"
  | "events"
  | "ambassador_stories"
  | "community_stories"
  | "campaigns";

export async function getPublishedStories(category?: StoryCategory) {
  const db = getDb();
  const locale = await getRequestLocale();
  const filters = [eq(stories.status, "published"), eq(stories.locale, locale)];
  if (category) filters.push(eq(stories.category, category));
  const rows = await db
    .select()
    .from(stories)
    .where(and(...filters))
    .orderBy(desc(stories.publishedAt));
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  const fallbackFilters = [eq(stories.status, "published"), eq(stories.locale, fallback)];
  if (category) fallbackFilters.push(eq(stories.category, category));
  return db
    .select()
    .from(stories)
    .where(and(...fallbackFilters))
    .orderBy(desc(stories.publishedAt));
}

export async function getPublishedStory(slug: string) {
  const db = getDb();
  const [story] = await db
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), eq(stories.status, "published")))
    .limit(1);
  return story ?? null;
}
