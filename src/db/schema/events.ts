import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
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

export type EventCustomField = {
  id: string;
  label: string;
  kind: "text" | "choice";
  required: boolean;
  options: string[];
  multiple: boolean;
};

export type EventAnswers = Record<string, string | string[]>;

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  locale: text("locale").notNull().default("en"),
  title: text("title").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
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
  description: text("description").notNull().default(""),
  capacity: integer("capacity"),
  registrationOpen: boolean("registration_open").notNull().default(true),
  registrationType: eventRegistrationTypeEnum("registration_type")
    .notNull()
    .default("free"),
  ticketPrice: numeric("ticket_price", { precision: 12, scale: 2 }),
  ticketCurrency: text("ticket_currency").default("NGN"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  postEventReport: text("post_event_report"),
  youtubeUrl: text("youtube_url"),
  featuredImageUrl: text("featured_image_url"),
  thumbnailUrl: text("thumbnail_url"),
  customFields: jsonb("custom_fields").$type<EventCustomField[]>().notNull().default([]),
  reminderOffsetsHours: jsonb("reminder_offsets_hours").$type<number[]>().notNull().default([168, 24]),
  rsvpToken: text("rsvp_token").unique(),
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
  rsvpResponse: text("rsvp_response"),
  answers: jsonb("answers").$type<EventAnswers>().notNull().default({}),
  status: attendeeStatusEnum("status").notNull().default("registered"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const eventReminderSends = pgTable(
  "event_reminder_sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => eventRegistrations.id, { onDelete: "cascade" }),
    offsetHours: integer("offset_hours").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [unique("event_reminder_once").on(table.registrationId, table.offsetHours)],
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  program: one(programs, {
    fields: [events.programId],
    references: [programs.id],
  }),
  registrations: many(eventRegistrations),
  reminderSends: many(eventReminderSends),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  reminderSends: many(eventReminderSends),
}));

export const eventReminderSendsRelations = relations(eventReminderSends, ({ one }) => ({
  event: one(events, {
    fields: [eventReminderSends.eventId],
    references: [events.id],
  }),
  registration: one(eventRegistrations, {
    fields: [eventReminderSends.registrationId],
    references: [eventRegistrations.id],
  }),
}));
