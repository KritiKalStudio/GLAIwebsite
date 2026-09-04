import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { contentStatusEnum } from "@/db/schema/enums";
import { users } from "@/db/schema/users";

export type PageBlockType =
  | "hero"
  | "problem"
  | "stat_strip"
  | "card_grid"
  | "gallery"
  | "map"
  | "testimonial"
  | "rich_text"
  | "cta_banner"
  | "donate"
  | "stories"
  | "people"
  | "faq"
  | "video"
  | "form";

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    locale: text("locale").notNull().default("en"),
    title: text("title").notNull(),
    description: text("description"),
    status: contentStatusEnum("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "date" }),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),
    template: text("template").notNull().default("blocks"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("pages_slug_locale").on(table.slug, table.locale)],
);

export const pageBlocks = pgTable("page_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  type: text("type").$type<PageBlockType>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
});

export const pageVersions = pgTable("page_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(),
  createdById: uuid("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const pagesRelations = relations(pages, ({ many }) => ({
  blocks: many(pageBlocks),
  versions: many(pageVersions),
}));

export const pageBlocksRelations = relations(pageBlocks, ({ one }) => ({
  page: one(pages, { fields: [pageBlocks.pageId], references: [pages.id] }),
}));
