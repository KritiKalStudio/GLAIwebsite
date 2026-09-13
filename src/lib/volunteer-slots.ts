import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { volunteerApplications, volunteerOpportunities } from "@/db/schema";

const HELD_STATUSES = ["accepted", "applied"] as const;

export async function countHeldSlots(opportunityId: string) {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(volunteerApplications)
    .where(
      and(
        eq(volunteerApplications.opportunityId, opportunityId),
        inArray(volunteerApplications.status, [...HELD_STATUSES]),
      ),
    );
  return Number(row?.n ?? 0);
}

export async function remainingSlots(opportunityId: string, slots: number) {
  return Math.max(0, slots - (await countHeldSlots(opportunityId)));
}

export type VolunteerAssignResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "full"; suggestions: { slug: string; title: string }[] };

export async function listOpenRoleSuggestions(excludeId?: string) {
  const db = getDb();
  const roles = await db
    .select()
    .from(volunteerOpportunities)
    .where(eq(volunteerOpportunities.status, "published"));
  const open: { slug: string; title: string }[] = [];
  for (const role of roles) {
    if (excludeId && role.id === excludeId) continue;
    const left = await remainingSlots(role.id, role.slots);
    if (left > 0) open.push({ slug: role.slug, title: role.title });
  }
  return open;
}

export async function assignVolunteerRole(input: {
  opportunitySlug: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  country: string;
}): Promise<VolunteerAssignResult> {
  const db = getDb();
  const [role] = await db
    .select()
    .from(volunteerOpportunities)
    .where(eq(volunteerOpportunities.slug, input.opportunitySlug))
    .limit(1);
  if (!role || role.status !== "published") {
    return { ok: false, reason: "missing", suggestions: await listOpenRoleSuggestions() };
  }

  const [existing] = await db
    .select()
    .from(volunteerApplications)
    .where(and(eq(volunteerApplications.opportunityId, role.id), eq(volunteerApplications.userId, input.userId)))
    .limit(1);

  if (existing && (existing.status === "accepted" || existing.status === "applied")) {
    return { ok: true };
  }

  const left = await remainingSlots(role.id, role.slots);
  if (left <= 0) {
    return { ok: false, reason: "full", suggestions: await listOpenRoleSuggestions(role.id) };
  }

  if (existing) {
    await db
      .update(volunteerApplications)
      .set({
        status: "accepted",
        fullName: input.fullName,
        email: input.email,
        phone: input.phone ?? existing.phone,
        country: input.country,
      })
      .where(eq(volunteerApplications.id, existing.id));
    return { ok: true };
  }

  await db.insert(volunteerApplications).values({
    opportunityId: role.id,
    userId: input.userId,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone ?? null,
    country: input.country,
    message: "Applied from membership dashboard",
    status: "accepted",
  });
  return { ok: true };
}

export async function unassignVolunteerRole(opportunityId: string, userId: string) {
  const db = getDb();
  await db
    .update(volunteerApplications)
    .set({ status: "withdrawn" })
    .where(
      and(eq(volunteerApplications.opportunityId, opportunityId), eq(volunteerApplications.userId, userId)),
    );
}
