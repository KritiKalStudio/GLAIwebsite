import "@/lib/dns-ipv6";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requiredEnv } from "@/lib/env";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

export function getSql() {
  if (!globalForDb.sql) {
    globalForDb.sql = postgres(requiredEnv("DATABASE_URL"), {
      max: 1,
      prepare: false,
      ssl: "require",
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return globalForDb.sql;
}

export function getDb() {
  return drizzle(getSql(), { schema });
}
