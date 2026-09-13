import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { youtubeVideos } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";

export type VideoCollection = "podcast" | "news";

export const getPublishedVideos = cached(
  "published-videos",
  [CACHE_TAGS.videos],
  async (collection: VideoCollection) => {
    const db = getDb();
    return db
      .select()
      .from(youtubeVideos)
      .where(and(eq(youtubeVideos.status, "published"), eq(youtubeVideos.collection, collection)))
      .orderBy(asc(youtubeVideos.sortOrder), desc(youtubeVideos.publishedAt), desc(youtubeVideos.createdAt));
  },
);
