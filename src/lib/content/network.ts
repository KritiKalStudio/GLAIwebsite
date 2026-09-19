import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import {
  GEO_POLITICAL_ZONES,
  lgasForState,
  slugifyPlace,
  statesInZone,
} from "@/lib/nigeria-locations";

const ACTIVE = inArray(ambassadors.status, ["approved", "active"]);

export type CountRow = { name: string; slug: string; total: number };

function withZeros(names: string[], counted: { name: string | null; total: number }[]): CountRow[] {
  const map = new Map(counted.filter((row) => row.name).map((row) => [row.name as string, Number(row.total)]));
  return names
    .map((name) => ({
      name,
      slug: slugifyPlace(name),
      total: map.get(name) ?? 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function onlyPresent(counted: { name: string | null; total: number }[]): CountRow[] {
  return counted
    .filter((row) => row.name)
    .map((row) => ({
      name: row.name as string,
      slug: slugifyPlace(row.name as string),
      total: Number(row.total),
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export const getNigeriaZoneCounts = cached("network-ng-zones", [CACHE_TAGS.ambassadors], async () => {
  const rows = await getDb()
    .select({
      name: ambassadors.geoPoliticalZone,
      total: sql<number>`count(*)::int`,
    })
    .from(ambassadors)
    .where(and(eq(ambassadors.countryCode, "NG"), ACTIVE))
    .groupBy(ambassadors.geoPoliticalZone);
  return withZeros([...GEO_POLITICAL_ZONES], rows);
});

export const getNigeriaStateCounts = cached(
  "network-ng-states",
  [CACHE_TAGS.ambassadors],
  async (zone: string) => {
    const rows = await getDb()
      .select({
        name: ambassadors.stateOfOrigin,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(and(eq(ambassadors.countryCode, "NG"), eq(ambassadors.geoPoliticalZone, zone), ACTIVE))
      .groupBy(ambassadors.stateOfOrigin);
    return withZeros(statesInZone(zone), rows);
  },
);

export const getNigeriaLgaCounts = cached(
  "network-ng-lgas",
  [CACHE_TAGS.ambassadors],
  async (state: string) => {
    const rows = await getDb()
      .select({
        name: ambassadors.localGovernment,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(and(eq(ambassadors.countryCode, "NG"), eq(ambassadors.stateOfOrigin, state), ACTIVE))
      .groupBy(ambassadors.localGovernment);
    return withZeros(
      lgasForState(state).filter((name) => name !== "Not applicable"),
      rows,
    );
  },
);

export const getNigeriaWardCounts = cached(
  "network-ng-wards",
  [CACHE_TAGS.ambassadors],
  async (state: string, lga: string) => {
    const rows = await getDb()
      .select({
        name: ambassadors.electoralWard,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(
        and(
          eq(ambassadors.countryCode, "NG"),
          eq(ambassadors.stateOfOrigin, state),
          eq(ambassadors.localGovernment, lga),
          ACTIVE,
        ),
      )
      .groupBy(ambassadors.electoralWard);
    return onlyPresent(rows);
  },
);

export const getNigeriaPollingUnitCounts = cached(
  "network-ng-pus",
  [CACHE_TAGS.ambassadors],
  async (state: string, lga: string, ward: string) => {
    const rows = await getDb()
      .select({
        name: ambassadors.pollingUnit,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(
        and(
          eq(ambassadors.countryCode, "NG"),
          eq(ambassadors.stateOfOrigin, state),
          eq(ambassadors.localGovernment, lga),
          eq(ambassadors.electoralWard, ward),
          ACTIVE,
        ),
      )
      .groupBy(ambassadors.pollingUnit);
    return onlyPresent(rows);
  },
);

export type NetworkPlaceFilter = {
  countryCode: string;
  zone?: string;
  state?: string;
  lga?: string;
  ward?: string;
  pollingUnit?: string;
};

export const getDirectoryAtPlace = cached(
  "network-directory-place",
  [CACHE_TAGS.ambassadors],
  async (filter: NetworkPlaceFilter) => {
    const clauses = [
      eq(ambassadors.countryCode, filter.countryCode),
      ACTIVE,
      eq(ambassadors.consentToDirectory, true),
    ];
    if (filter.zone) clauses.push(eq(ambassadors.geoPoliticalZone, filter.zone));
    if (filter.state) clauses.push(eq(ambassadors.stateOfOrigin, filter.state));
    if (filter.lga) clauses.push(eq(ambassadors.localGovernment, filter.lga));
    if (filter.ward) clauses.push(eq(ambassadors.electoralWard, filter.ward));
    if (filter.pollingUnit) clauses.push(eq(ambassadors.pollingUnit, filter.pollingUnit));
    return getDb()
      .select({
        id: ambassadors.id,
        fullName: ambassadors.fullName,
        country: ambassadors.country,
        region: ambassadors.region,
        profession: ambassadors.profession,
      })
      .from(ambassadors)
      .where(and(...clauses));
  },
);

export const getPlaceMemberTotal = cached(
  "network-place-total",
  [CACHE_TAGS.ambassadors],
  async (filter: NetworkPlaceFilter) => {
    const clauses = [eq(ambassadors.countryCode, filter.countryCode), ACTIVE];
    if (filter.zone) clauses.push(eq(ambassadors.geoPoliticalZone, filter.zone));
    if (filter.state) clauses.push(eq(ambassadors.stateOfOrigin, filter.state));
    if (filter.lga) clauses.push(eq(ambassadors.localGovernment, filter.lga));
    if (filter.ward) clauses.push(eq(ambassadors.electoralWard, filter.ward));
    if (filter.pollingUnit) clauses.push(eq(ambassadors.pollingUnit, filter.pollingUnit));
    const [row] = await getDb()
      .select({ total: sql<number>`count(*)::int` })
      .from(ambassadors)
      .where(and(...clauses));
    return Number(row?.total ?? 0);
  },
);
