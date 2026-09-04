import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { campaigns, sponsorTiers } from "@/db/schema";

export async function getPublishedCampaigns() {
  const db = getDb();
  return db.select().from(campaigns).where(eq(campaigns.status, "published"));
}

export async function getPublishedCampaign(slug: string) {
  const db = getDb();
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);
  return campaign ?? null;
}

export async function getSponsorTiers() {
  const db = getDb();
  return db.select().from(sponsorTiers).orderBy(sponsorTiers.sortOrder);
}
