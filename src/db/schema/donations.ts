import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  contentStatusEnum,
  donationFrequencyEnum,
  donationStatusEnum,
  recurringStatusEnum,
} from "@/db/schema/enums";
import { programs, projects } from "@/db/schema/programs";
import { users } from "@/db/schema/users";

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  goalAmount: numeric("goal_amount", { precision: 14, scale: 2 }),
  currency: text("currency").notNull().default("NGN"),
  featuredImageUrl: text("featured_image_url"),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
  status: contentStatusEnum("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const sponsorTiers = pgTable("sponsor_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  benefits: text("benefits").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "set null",
  }),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  frequency: donationFrequencyEnum("frequency").notNull().default("one_time"),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email").notNull(),
  donorPhone: text("donor_phone"),
  donorOrganization: text("donor_organization"),
  isAnonymous: text("is_anonymous").notNull().default("false"),
  isMember: text("is_member").notNull().default("false"),
  receiptUrl: text("receipt_url"),
  processor: text("processor").notNull().default("sandbox"),
  processorRef: text("processor_ref"),
  status: donationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const recurringDonations = pgTable("recurring_donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  donationId: uuid("donation_id")
    .notNull()
    .references(() => donations.id, { onDelete: "cascade" }),
  donorEmail: text("donor_email").notNull(),
  manageTokenHash: text("manage_token_hash").notNull().unique(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  status: recurringStatusEnum("status").notNull().default("active"),
  nextChargeAt: timestamp("next_charge_at", {
    withTimezone: true,
    mode: "date",
  }),
  processorRef: text("processor_ref"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  program: one(programs, {
    fields: [campaigns.programId],
    references: [programs.id],
  }),
  project: one(projects, {
    fields: [campaigns.projectId],
    references: [projects.id],
  }),
  donations: many(donations),
  tiers: many(sponsorTiers),
}));

export const sponsorTiersRelations = relations(sponsorTiers, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [sponsorTiers.campaignId],
    references: [campaigns.id],
  }),
}));

export const donationsRelations = relations(donations, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [donations.campaignId],
    references: [campaigns.id],
  }),
  recurring: many(recurringDonations),
}));

export const recurringDonationsRelations = relations(
  recurringDonations,
  ({ one }) => ({
    donation: one(donations, {
      fields: [recurringDonations.donationId],
      references: [donations.id],
    }),
  }),
);
