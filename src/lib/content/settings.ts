import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { faqItems, impactStats, people, siteSettings } from "@/db/schema";

export async function getSiteSettings() {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);
  return settings ?? null;
}

export async function getPublishedPeople() {
  const db = getDb();
  return db
    .select()
    .from(people)
    .where(eq(people.status, "published"))
    .orderBy(people.sortOrder);
}

export async function getPublicImpactStats() {
  const db = getDb();
  return db
    .select()
    .from(impactStats)
    .where(eq(impactStats.isPublic, true))
    .orderBy(impactStats.sortOrder);
}

export async function getPublishedFaqs(audience?: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(faqItems)
    .where(eq(faqItems.status, "published"))
    .orderBy(faqItems.sortOrder);
  if (!audience) return rows;
  return rows.filter((row) => row.audience === audience || row.audience === "general");
}
