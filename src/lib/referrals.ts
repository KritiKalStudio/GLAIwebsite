import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { tierForCount, type ReferralTier } from "@/lib/referral-tiers";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ReferralBoardEntry = {
  rank: number;
  id: string;
  fullName: string;
  country: string;
  referralCount: number;
  referralCode: string | null;
  tier: ReferralTier | null;
};

export function generateReferralCode() {
  const bytes = randomBytes(6);
  let body = "";
  for (let index = 0; index < 6; index++) {
    body += ALPHABET[bytes[index]! % ALPHABET.length];
  }
  return `GLAI-${body}`;
}

function isUniqueViolation(error: unknown) {
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const record = current as { code?: unknown; cause?: unknown };
    if (record.code === "23505") return true;
    if (record.cause) pending.push(record.cause);
  }
  return false;
}

export async function allocateReferralCode(): Promise<string | null> {
  const db = getDb();
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateReferralCode();
    const [existing] = await db
      .select({ id: ambassadors.id })
      .from(ambassadors)
      .where(eq(ambassadors.referralCode, code))
      .limit(1);
    if (!existing) return code;
  }
  return null;
}

export async function ensureReferralCode(ambassadorId: string): Promise<string | null> {
  const db = getDb();
  const [current] = await db
    .select({ referralCode: ambassadors.referralCode })
    .from(ambassadors)
    .where(eq(ambassadors.id, ambassadorId))
    .limit(1);
  if (current?.referralCode) return current.referralCode;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateReferralCode();
    try {
      const [row] = await db
        .update(ambassadors)
        .set({ referralCode: code })
        .where(and(eq(ambassadors.id, ambassadorId), isNull(ambassadors.referralCode)))
        .returning({ referralCode: ambassadors.referralCode });
      if (row?.referralCode) return row.referralCode;
      const [again] = await db
        .select({ referralCode: ambassadors.referralCode })
        .from(ambassadors)
        .where(eq(ambassadors.id, ambassadorId))
        .limit(1);
      if (again?.referralCode) return again.referralCode;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return null;
}

export async function backfillMissingReferralCodes(limit = 500) {
  const missing = await getDb()
    .select({ id: ambassadors.id })
    .from(ambassadors)
    .where(and(eq(ambassadors.status, "active"), isNotNull(ambassadors.userId), isNull(ambassadors.referralCode)))
    .limit(limit);
  for (const row of missing) {
    await ensureReferralCode(row.id);
  }
  return missing.length;
}

export async function findActiveReferrer(code: string) {
  const [row] = await getDb()
    .select({
      id: ambassadors.id,
      email: ambassadors.email,
      fullName: ambassadors.fullName,
      referralCode: ambassadors.referralCode,
    })
    .from(ambassadors)
    .where(and(eq(ambassadors.referralCode, code), eq(ambassadors.status, "active"), isNotNull(ambassadors.userId)))
    .limit(1);
  return row ?? null;
}

export async function countSuccessfulReferrals(ambassadorId: string) {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(ambassadors)
    .where(
      and(eq(ambassadors.referredById, ambassadorId), eq(ambassadors.status, "active"), isNotNull(ambassadors.userId)),
    );
  return Number(row?.count ?? 0);
}

export async function loadReferralBoard(): Promise<ReferralBoardEntry[]> {
  const db = getDb();
  const referred = alias(ambassadors, "referred_members");
  const rows = await db
    .select({
      id: ambassadors.id,
      fullName: ambassadors.fullName,
      country: ambassadors.country,
      referralCode: ambassadors.referralCode,
      referralCount: sql<number>`count(${referred.id})::int`,
      latestReferralAt: sql<Date | null>`max(${referred.createdAt})`,
    })
    .from(ambassadors)
    .leftJoin(
      referred,
      and(eq(referred.referredById, ambassadors.id), eq(referred.status, "active"), isNotNull(referred.userId)),
    )
    .where(and(eq(ambassadors.status, "active"), isNotNull(ambassadors.userId)))
    .groupBy(ambassadors.id)
    .orderBy(desc(sql`count(${referred.id})`), asc(sql`max(${referred.createdAt})`), asc(ambassadors.createdAt));

  return rows.map((row, index) => {
    const referralCount = Number(row.referralCount ?? 0);
    return {
      rank: index + 1,
      id: row.id,
      fullName: row.fullName,
      country: row.country,
      referralCount,
      referralCode: row.referralCode,
      tier: tierForCount(referralCount),
    };
  });
}
