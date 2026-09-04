import { pgEnum } from "drizzle-orm/pg-core";

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "preview",
  "published",
  "archived",
]);

export const ambassadorStatusEnum = pgEnum("ambassador_status", [
  "applied",
  "approved",
  "active",
  "rejected",
  "withdrawn",
]);

export const donationFrequencyEnum = pgEnum("donation_frequency", [
  "one_time",
  "monthly",
]);

export const donationStatusEnum = pgEnum("donation_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const recurringStatusEnum = pgEnum("recurring_status", [
  "active",
  "paused",
  "cancelled",
]);

export const eventRegistrationTypeEnum = pgEnum("event_registration_type", [
  "free",
  "ticketed",
  "closed",
]);

export const attendeeStatusEnum = pgEnum("attendee_status", [
  "registered",
  "waitlist",
  "cancelled",
  "attended",
]);

export const volunteerStatusEnum = pgEnum("volunteer_status", [
  "applied",
  "accepted",
  "declined",
  "withdrawn",
]);

export const focusAreaEnum = pgEnum("focus_area", [
  "education",
  "peacebuilding",
  "community_development",
  "youth_engagement",
  "dialogue",
  "humanitarian_action",
]);

export const storyCategoryEnum = pgEnum("story_category", [
  "stories_of_change",
  "news",
  "events",
  "ambassador_stories",
  "community_stories",
  "campaigns",
]);

export const peopleGroupEnum = pgEnum("people_group", [
  "board",
  "executive",
  "advisor",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "unread",
  "read",
  "archived",
]);

export const notificationDeliveryStatusEnum = pgEnum(
  "notification_delivery_status",
  ["queued", "sent", "failed"],
);
