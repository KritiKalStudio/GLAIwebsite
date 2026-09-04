import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, focusAreaEnum } from "@/db/schema/enums";

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  locale: text("locale").notNull().default("en"),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  purpose: text("purpose").notNull(),
  whoCanParticipate: text("who_can_participate"),
  curriculum: jsonb("curriculum").$type<string[]>().notNull().default([]),
  process: text("process"),
  outcomes: text("outcomes"),
  applyCtaLabel: text("apply_cta_label"),
  applyHref: text("apply_href"),
  featuredImageUrl: text("featured_image_url"),
  youtubeUrl: text("youtube_url"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  locale: text("locale").notNull().default("en"),
  title: text("title").notNull(),
  focusArea: focusAreaEnum("focus_area").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  occurredOn: timestamp("occurred_on", { withTimezone: true, mode: "date" }),
  challenge: text("challenge").notNull(),
  actionsTaken: text("actions_taken").notNull(),
  peopleReached: integer("people_reached"),
  partners: jsonb("partners").$type<string[]>().notNull().default([]),
  sponsors: jsonb("sponsors").$type<string[]>().notNull().default([]),
  communitiesEngaged: integer("communities_engaged"),
  ambassadorsTrained: integer("ambassadors_trained"),
  dialoguesConducted: integer("dialogues_conducted"),
  volunteersCount: integer("volunteers_count"),
  fundsDeployed: numeric("funds_deployed", { precision: 14, scale: 2 }),
  fundsCurrency: text("funds_currency").default("NGN"),
  youtubeUrl: text("youtube_url"),
  reportUrl: text("report_url"),
  featuredImageUrl: text("featured_image_url"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  lastUpdated: timestamp("last_updated", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const programsRelations = relations(programs, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  program: one(programs, {
    fields: [projects.programId],
    references: [programs.id],
  }),
}));
