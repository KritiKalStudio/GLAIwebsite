import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  attendeeStatusEnum,
  contentStatusEnum,
  eventRegistrationTypeEnum,
} from "@/db/schema/enums";
import { programs } from "@/db/schema/programs";

export type EventSpeaker = {
  name: string;
  title?: string;
  bio?: string;
  photoUrl?: string;
};

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  locale: text("locale").notNull().default("en"),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" })
    .notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  venueName: text("venue_name"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  countryCode: text("country_code"),
  isOnline: boolean("is_online").notNull().default(false),
  onlineUrl: text("online_url"),
  speakers: jsonb("speakers").$type<EventSpeaker[]>().notNull().default([]),
  description: text("description").notNull(),
  capacity: integer("capacity"),
  registrationType: eventRegistrationTypeEnum("registration_type")
    .notNull()
    .default("free"),
  ticketPrice: numeric("ticket_price", { precision: 12, scale: 2 }),
  ticketCurrency: text("ticket_currency").default("NGN"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  postEventReport: text("post_event_report"),
  youtubeUrl: text("youtube_url"),
  featuredImageUrl: text("featured_image_url"),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: attendeeStatusEnum("status").notNull().default("registered"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  program: one(programs, {
    fields: [events.programId],
    references: [programs.id],
  }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(
  eventRegistrations,
  ({ one }) => ({
    event: one(events, {
      fields: [eventRegistrations.eventId],
      references: [events.id],
    }),
  }),
);
