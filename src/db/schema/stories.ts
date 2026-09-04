import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, storyCategoryEnum } from "@/db/schema/enums";
import { programs, projects } from "@/db/schema/programs";
import { users } from "@/db/schema/users";

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  locale: text("locale").notNull().default("en"),
  title: text("title").notNull(),
  category: storyCategoryEnum("category").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  featuredImageUrl: text("featured_image_url"),
  authorName: text("author_name"),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  involvesMinors: boolean("involves_minors").notNull().default(false),
  safeguardingReviewed: boolean("safeguarding_reviewed").notNull().default(false),
  safeguardingReviewedAt: timestamp("safeguarding_reviewed_at", {
    withTimezone: true,
    mode: "date",
  }),
  safeguardingReviewedById: uuid("safeguarding_reviewed_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  status: contentStatusEnum("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "date" }),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const storiesRelations = relations(stories, ({ one }) => ({
  program: one(programs, {
    fields: [stories.programId],
    references: [programs.id],
  }),
  project: one(projects, {
    fields: [stories.projectId],
    references: [projects.id],
  }),
}));
