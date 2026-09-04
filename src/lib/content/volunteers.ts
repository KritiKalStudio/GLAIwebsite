import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { volunteerOpportunities } from "@/db/schema";

export async function getPublishedOpportunities() {
  const db = getDb();
  return db
    .select()
    .from(volunteerOpportunities)
    .where(eq(volunteerOpportunities.status, "published"));
}
