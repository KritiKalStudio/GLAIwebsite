import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { contentStatusEnum, peopleGroupEnum } from "@/db/schema/enums";

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type LanguageOption = {
  code: string;
  name: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("default"),
  orgName: text("org_name").notNull(),
  tagline: text("tagline").notNull(),
  languages: jsonb("languages").$type<LanguageOption[]>().notNull(),
  navigation: jsonb("navigation").$type<NavItem[]>().notNull(),
  footer: jsonb("footer")
    .$type<{
      tagline: string;
      columns: { title: string; links: { label: string; href: string }[] }[];
      legalLinks: { label: string; href: string }[];
      newsletterLabel: string;
      newsletterPlaceholder: string;
      copyright: string;
    }>()
    .notNull(),
  headerCtas: jsonb("header_ctas")
    .$type<{ donateLabel: string; donateHref: string; joinLabel: string; joinHref: string }>()
    .notNull(),
  designTokens: jsonb("design_tokens")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  social: jsonb("social")
    .$type<{ platform: string; href: string }[]>()
    .notNull()
    .default([]),
  contact: jsonb("contact")
    .$type<{
      email: string;
      pressEmail: string;
      phone: string;
      address: string;
    }>()
    .notNull(),
  defaultSeo: jsonb("default_seo")
    .$type<{ title: string; description: string }>()
    .notNull(),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  group: peopleGroupEnum("group").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio").notNull(),
  responsibility: text("responsibility"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: contentStatusEnum("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const impactStats = pgTable("impact_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  valueDisplay: text("value_display").notNull(),
  numericValue: integer("numeric_value"),
  source: text("source"),
  lastUpdated: timestamp("last_updated", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
});

export const faqItems = pgTable("faq_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  audience: text("audience").notNull().default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: contentStatusEnum("status").notNull().default("published"),
});

export const partnerships = pgTable("partnerships", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  href: text("href"),
  type: text("type").notNull().default("partner"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: contentStatusEnum("status").notNull().default("published"),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("unread"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  locale: text("locale").notNull().default("en"),
  status: text("status").notNull().default("subscribed"),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
