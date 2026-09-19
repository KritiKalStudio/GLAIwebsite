import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ngPollingUnits, ngWards } from "@/db/schema";
import {
  canonicalLgaName,
  canonicalStateName,
  isNigerianState,
  lgasForState,
  NOT_APPLICABLE,
  slugifyPlace,
  zoneForState,
} from "@/lib/nigeria-locations";

export type MembershipPlace = {
  stateOfOrigin: string;
  localGovernment: string;
  geoPoliticalZone: string | null;
  electoralWard: string | null;
  pollingUnit: string | null;
};

function uniqueNames(rows: { name: string }[]) {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const row of rows) {
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    names.push(row.name);
  }
  return names;
}

export async function listWards(state: string, lga: string) {
  const canonicalState = canonicalStateName(state);
  const canonicalLga = canonicalState ? canonicalLgaName(canonicalState, lga) : null;
  if (!canonicalState || !canonicalLga) return [];
  const rows = await getDb()
    .select({ name: ngWards.name })
    .from(ngWards)
    .where(and(eq(ngWards.stateName, canonicalState), eq(ngWards.lgaName, canonicalLga)))
    .orderBy(ngWards.name);
  return uniqueNames(rows);
}

export async function listPollingUnits(state: string, lga: string, ward: string) {
  const canonicalState = canonicalStateName(state);
  const canonicalLga = canonicalState ? canonicalLgaName(canonicalState, lga) : null;
  if (!canonicalState || !canonicalLga || !ward) return [];
  const rows = await getDb()
    .select({ name: ngPollingUnits.name })
    .from(ngPollingUnits)
    .where(
      and(
        eq(ngPollingUnits.stateName, canonicalState),
        eq(ngPollingUnits.lgaName, canonicalLga),
        eq(ngPollingUnits.wardName, ward),
      ),
    )
    .orderBy(ngPollingUnits.name);
  return uniqueNames(rows);
}

export async function findWardBySlug(state: string, lga: string, slug: string) {
  const wards = await listWards(state, lga);
  return wards.find((name) => slugifyPlace(name) === slug) ?? null;
}

export async function findPollingUnitBySlug(state: string, lga: string, ward: string, slug: string) {
  const units = await listPollingUnits(state, lga, ward);
  return units.find((name) => slugifyPlace(name) === slug) ?? null;
}

export async function resolveMembershipPlace(input: {
  stateOfOrigin: string;
  localGovernment: string;
  electoralWard?: string | null;
  pollingUnit?: string | null;
}): Promise<{ ok: true; value: MembershipPlace } | { ok: false; error: string }> {
  const stateOfOrigin = input.stateOfOrigin.trim();
  const localGovernment = input.localGovernment.trim();
  const electoralWard = input.electoralWard?.trim() || null;
  const pollingUnit = input.pollingUnit?.trim() || null;

  if (!stateOfOrigin) {
    return { ok: false, error: "Choose a valid state of origin and local government." };
  }

  if (stateOfOrigin === NOT_APPLICABLE) {
    if (localGovernment !== NOT_APPLICABLE) {
      return { ok: false, error: "Choose a valid state of origin and local government." };
    }
    if (electoralWard || pollingUnit) {
      return { ok: false, error: "Electoral ward and polling unit are only for Nigerian states." };
    }
    return {
      ok: true,
      value: {
        stateOfOrigin,
        localGovernment: NOT_APPLICABLE,
        geoPoliticalZone: null,
        electoralWard: null,
        pollingUnit: null,
      },
    };
  }

  const allowedLgas = lgasForState(stateOfOrigin);
  if (!allowedLgas.includes(localGovernment)) {
    return { ok: false, error: "Choose a valid state of origin and local government." };
  }

  if (!isNigerianState(stateOfOrigin)) {
    return { ok: false, error: "Choose a valid state of origin and local government." };
  }

  if (pollingUnit && !electoralWard) {
    return { ok: false, error: "Select an electoral ward before choosing a polling unit." };
  }

  if (electoralWard) {
    const wards = await listWards(stateOfOrigin, localGovernment);
    if (!wards.includes(electoralWard)) {
      return { ok: false, error: "Choose a valid electoral ward for that local government." };
    }
  }

  if (pollingUnit && electoralWard) {
    const units = await listPollingUnits(stateOfOrigin, localGovernment, electoralWard);
    if (!units.includes(pollingUnit)) {
      return { ok: false, error: "Choose a valid polling unit for that ward." };
    }
  }

  return {
    ok: true,
    value: {
      stateOfOrigin,
      localGovernment,
      geoPoliticalZone: zoneForState(stateOfOrigin),
      electoralWard,
      pollingUnit,
    },
  };
}

export async function gazetteerCounts() {
  const db = getDb();
  const [wards] = await db.select({ total: sql<number>`count(*)::int` }).from(ngWards);
  const [units] = await db.select({ total: sql<number>`count(*)::int` }).from(ngPollingUnits);
  return { wards: wards?.total ?? 0, pollingUnits: units?.total ?? 0 };
}
