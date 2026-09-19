import { index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

export const ngWards = pgTable(
  "ng_wards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateName: text("state_name").notNull(),
    lgaName: text("lga_name").notNull(),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
  },
  (table) => [
    unique("ng_wards_unique").on(table.stateName, table.lgaName, table.name),
    index("ng_wards_lookup_idx").on(table.stateName, table.lgaName),
  ],
);

export const ngPollingUnits = pgTable(
  "ng_polling_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateName: text("state_name").notNull(),
    lgaName: text("lga_name").notNull(),
    wardName: text("ward_name").notNull(),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
  },
  (table) => [
    unique("ng_polling_units_unique").on(
      table.stateName,
      table.lgaName,
      table.wardName,
      table.name,
      table.code,
    ),
    index("ng_polling_units_lookup_idx").on(table.stateName, table.lgaName, table.wardName),
  ],
);
