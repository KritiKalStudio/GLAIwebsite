import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { volunteerOpportunities } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { remainingSlots } from "@/lib/volunteer-slots";

export const getPublishedOpportunities = cached(
  "published-opportunities",
  [CACHE_TAGS.volunteers],
  async () => {
    const db = getDb();
    return db
      .select()
      .from(volunteerOpportunities)
      .where(eq(volunteerOpportunities.status, "published"));
  },
);

export async function getPublishedOpportunitiesWithSlots() {
  const roles = await getPublishedOpportunities();
  return Promise.all(
    roles.map(async (role) => {
      const remaining = await remainingSlots(role.id, role.slots);
      return { ...role, remaining };
    }),
  );
}
