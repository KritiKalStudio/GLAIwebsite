import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stories } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";

export type StoryCategory =
  | "stories_of_change"
  | "news"
  | "events"
  | "ambassador_stories"
  | "community_stories"
  | "campaigns";

const loadPublishedStories = cached(
  "published-stories",
  [CACHE_TAGS.stories],
  async (locale: string, category: string) => {
    const db = getDb();
    const filters = [eq(stories.status, "published"), eq(stories.locale, locale)];
    if (category) filters.push(eq(stories.category, category as StoryCategory));
    return db
      .select()
      .from(stories)
      .where(and(...filters))
      .orderBy(desc(stories.publishedAt));
  },
);

export async function getPublishedStories(category?: StoryCategory) {
  const locale = await getRequestLocale();
  const key = category ?? "";
  const rows = await loadPublishedStories(locale, key);
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return loadPublishedStories(fallback, key);
}

export const getPublishedStory = cached("published-story", [CACHE_TAGS.stories], async (slug: string) => {
  const db = getDb();
  const [story] = await db
    .select()
    .from(stories)
    .where(and(eq(stories.slug, slug), eq(stories.status, "published")))
    .limit(1);
  return story ?? null;
});
