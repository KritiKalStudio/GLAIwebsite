import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ambassadors, trainingModules } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";

export const getCountryCounts = cached("ambassador-country-counts", [CACHE_TAGS.ambassadors], async () => {
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
});

const loadDirectoryAmbassadors = cached(
  "directory-ambassadors",
  [CACHE_TAGS.ambassadors],
  async (countryCode: string) => {
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
  },
);

export async function getDirectoryAmbassadors(countryCode?: string) {
  return loadDirectoryAmbassadors(countryCode ?? "");
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

export const getTrainingModules = cached("training-modules", [CACHE_TAGS.ambassadors], async () => {
  const db = getDb();
  return db.select().from(trainingModules).orderBy(trainingModules.sortOrder);
});
