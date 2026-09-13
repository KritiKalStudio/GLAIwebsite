import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { campaigns, sponsorTiers } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";

export const getPublishedCampaigns = cached("published-campaigns", [CACHE_TAGS.donations], async () => {
  const db = getDb();
  return db.select().from(campaigns).where(eq(campaigns.status, "published"));
});

export const getPublishedCampaign = cached("published-campaign", [CACHE_TAGS.donations], async (slug: string) => {
  const db = getDb();
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);
  return campaign ?? null;
});

export const getSponsorTiers = cached("sponsor-tiers", [CACHE_TAGS.donations], async () => {
  const db = getDb();
  return db.select().from(sponsorTiers).orderBy(sponsorTiers.sortOrder);
});
