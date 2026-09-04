import { relations } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, volunteerStatusEnum } from "@/db/schema/enums";

export const volunteerOpportunities = pgTable("volunteer_opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  status: contentStatusEnum("status").notNull().default("published"),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const volunteerApplications = pgTable("volunteer_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id").references(
    () => volunteerOpportunities.id,
    { onDelete: "set null" },
  ),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country").notNull(),
  message: text("message").notNull(),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  status: volunteerStatusEnum("status").notNull().default("applied"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const volunteerOpportunitiesRelations = relations(
  volunteerOpportunities,
  ({ many }) => ({
    applications: many(volunteerApplications),
  }),
);

export const volunteerApplicationsRelations = relations(
  volunteerApplications,
  ({ one }) => ({
    opportunity: one(volunteerOpportunities, {
      fields: [volunteerApplications.opportunityId],
      references: [volunteerOpportunities.id],
    }),
  }),
);
