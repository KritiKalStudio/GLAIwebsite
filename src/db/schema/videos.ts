import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { contentStatusEnum } from "@/db/schema/enums";

export const youtubeVideos = pgTable(
  "youtube_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    youtubeUrl: text("youtube_url").notNull(),
    youtubeId: text("youtube_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    thumbnailUrl: text("thumbnail_url"),
    collection: text("collection").notNull().default("podcast"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatusEnum("status").notNull().default("published"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("youtube_videos_collection_id").on(table.collection, table.youtubeId)],
);
