import {
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { notificationDeliveryStatusEnum } from "@/db/schema/enums";

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    locale: text("locale").notNull().default("en"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("notification_type_locale").on(table.type, table.locale)],
);

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateType: text("template_type").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: notificationDeliveryStatusEnum("status").notNull().default("queued"),
  error: text("error"),
  payload: jsonb("payload").$type<Record<string, string>>().default({}),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
