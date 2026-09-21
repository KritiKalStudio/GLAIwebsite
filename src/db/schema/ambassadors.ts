import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ambassadorStatusEnum } from "@/db/schema/enums";
import { users } from "@/db/schema/users";

export type SignupPayload = {
  fullName: string;
  email: string;
  whatsapp: string;
  age: number;
  country: string;
  stateOfOrigin: string;
  localGovernment: string;
  electoralWard: string | null;
  pollingUnit: string | null;
  currentAddress: string;
  nationality: string;
  tribe: string;
  religion: string;
  education: string;
  occupation: string;
  organization: string;
  otpChannel: "whatsapp" | "email";
  referralCode?: string | null;
};

export const ambassadors = pgTable(
  "ambassadors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    age: integer("age"),
    stateOfOrigin: text("state_of_origin"),
    localGovernment: text("local_government"),
    geoPoliticalZone: text("geo_political_zone"),
    electoralWard: text("electoral_ward"),
    pollingUnit: text("polling_unit"),
    currentAddress: text("current_address"),
    nationality: text("nationality"),
    tribe: text("tribe"),
    religion: text("religion"),
    education: text("education"),
    occupation: text("occupation"),
    organization: text("organization"),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(),
    region: text("region"),
    profession: text("profession"),
    areasOfInterest: jsonb("areas_of_interest").$type<string[]>().notNull().default([]),
    whyJoin: text("why_join").notNull().default(""),
    volunteerInterests: jsonb("volunteer_interests")
      .$type<string[]>()
      .notNull()
      .default([]),
    photoUrl: text("photo_url"),
    status: ambassadorStatusEnum("status").notNull().default("active"),
    consentToDirectory: boolean("consent_to_directory").notNull().default(false),
    principlesAgreedAt: timestamp("principles_agreed_at", {
      withTimezone: true,
      mode: "date",
    }),
    contributions: text("contributions"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNotes: text("review_notes"),
    referralCode: text("referral_code").unique(),
    referredById: uuid("referred_by_id").references((): AnyPgColumn => ambassadors.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ambassadors_country_code_idx").on(table.countryCode),
    index("ambassadors_place_idx").on(
      table.countryCode,
      table.geoPoliticalZone,
      table.stateOfOrigin,
      table.localGovernment,
    ),
    index("ambassadors_referred_by_idx").on(table.referredById),
  ],
);

export const trainingModules = pgTable("training_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  content: text("content"),
});

export const ambassadorTrainingProgress = pgTable(
  "ambassador_training_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ambassadorId: uuid("ambassador_id")
      .notNull()
      .references(() => ambassadors.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("ambassador_module_unique").on(table.ambassadorId, table.moduleId),
  ],
);

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  ambassadorId: uuid("ambassador_id")
    .notNull()
    .references(() => ambassadors.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  fileUrl: text("file_url"),
});

export const ambassadorsRelations = relations(ambassadors, ({ one, many }) => ({
  user: one(users, { fields: [ambassadors.userId], references: [users.id] }),
  referrer: one(ambassadors, {
    fields: [ambassadors.referredById],
    references: [ambassadors.id],
    relationName: "ambassadorReferrals",
  }),
  referrals: many(ambassadors, { relationName: "ambassadorReferrals" }),
  training: many(ambassadorTrainingProgress),
  certificates: many(certificates),
}));

export const trainingModulesRelations = relations(
  trainingModules,
  ({ many }) => ({
    progress: many(ambassadorTrainingProgress),
  }),
);

export const ambassadorTrainingProgressRelations = relations(
  ambassadorTrainingProgress,
  ({ one }) => ({
    ambassador: one(ambassadors, {
      fields: [ambassadorTrainingProgress.ambassadorId],
      references: [ambassadors.id],
    }),
    module: one(trainingModules, {
      fields: [ambassadorTrainingProgress.moduleId],
      references: [trainingModules.id],
    }),
  }),
);

export const certificatesRelations = relations(certificates, ({ one }) => ({
  ambassador: one(ambassadors, {
    fields: [certificates.ambassadorId],
    references: [ambassadors.id],
  }),
}));

export const signupChallenges = pgTable("signup_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull(),
  codeHash: text("code_hash").notNull(),
  passwordHash: text("password_hash").notNull(),
  payload: jsonb("payload").$type<SignupPayload>().notNull(),
  volunteerRoleSlug: text("volunteer_role_slug"),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
