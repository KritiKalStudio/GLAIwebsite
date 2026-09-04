import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ambassadors, trainingModules } from "@/db/schema";

export async function getCountryCounts() {
  const db = getDb();
  return db
    .select({
      country: ambassadors.country,
      countryCode: ambassadors.countryCode,
      total: sql<number>`count(*)::int`,
    })
    .from(ambassadors)
    .where(inArray(ambassadors.status, ["approved", "active"]))
    .groupBy(ambassadors.country, ambassadors.countryCode);
}

export async function getDirectoryAmbassadors(countryCode?: string) {
  const db = getDb();
  const filters = [
    inArray(ambassadors.status, ["approved", "active"]),
    eq(ambassadors.consentToDirectory, true),
  ];
  if (countryCode) filters.push(eq(ambassadors.countryCode, countryCode));
  return db
    .select({
      id: ambassadors.id,
      fullName: ambassadors.fullName,
      country: ambassadors.country,
      countryCode: ambassadors.countryCode,
      region: ambassadors.region,
      profession: ambassadors.profession,
      photoUrl: ambassadors.photoUrl,
    })
    .from(ambassadors)
    .where(and(...filters));
}

export async function getAmbassadorByEmail(email: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(ambassadors)
    .where(eq(ambassadors.email, email.toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function getTrainingModules() {
  const db = getDb();
  return db.select().from(trainingModules).orderBy(trainingModules.sortOrder);
}
