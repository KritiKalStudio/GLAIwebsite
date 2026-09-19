import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { listPollingUnits, listWards } from "@/lib/nigeria-gazetteer";
import {
  GEO_POLITICAL_ZONES,
  lgasForState,
  NIGERIA_STATES,
  statesInZone,
} from "@/lib/nigeria-locations";

export type MembershipPlaceFilter = {
  countryCode: string;
  zone: string;
  state: string;
  lga: string;
  ward: string;
  pu: string;
};

type Search = Record<string, string | string[] | undefined>;

function one(search: Search, key: string) {
  const value = search[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseMembershipPlaceFilter(search: Search): MembershipPlaceFilter {
  const countryCode = one(search, "country").toUpperCase();
  const nigerian = countryCode === "NG";
  return {
    countryCode,
    zone: nigerian ? one(search, "zone") : "",
    state: nigerian ? one(search, "state") : "",
    lga: nigerian ? one(search, "lga") : "",
    ward: nigerian ? one(search, "ward") : "",
    pu: nigerian ? one(search, "pu") : "",
  };
}

export type CountChip = { name: string; total: number; href: string };

function filterClauses(filter: MembershipPlaceFilter) {
  const clauses: SQL[] = [];
  if (filter.countryCode) clauses.push(eq(ambassadors.countryCode, filter.countryCode));
  if (filter.zone) clauses.push(eq(ambassadors.geoPoliticalZone, filter.zone));
  if (filter.state) clauses.push(eq(ambassadors.stateOfOrigin, filter.state));
  if (filter.lga) clauses.push(eq(ambassadors.localGovernment, filter.lga));
  if (filter.ward) clauses.push(eq(ambassadors.electoralWard, filter.ward));
  if (filter.pu) clauses.push(eq(ambassadors.pollingUnit, filter.pu));
  return clauses;
}

function hrefFor(next: Partial<MembershipPlaceFilter>) {
  const params = new URLSearchParams();
  if (next.countryCode) params.set("country", next.countryCode);
  if (next.zone) params.set("zone", next.zone);
  if (next.state) params.set("state", next.state);
  if (next.lga) params.set("lga", next.lga);
  if (next.ward) params.set("ward", next.ward);
  if (next.pu) params.set("pu", next.pu);
  const query = params.toString();
  return query ? `/admin/membership?${query}` : "/admin/membership";
}

export async function listMembershipFilterOptions(filter: MembershipPlaceFilter) {
  const countries = await getDb()
    .select({
      countryCode: ambassadors.countryCode,
      country: ambassadors.country,
      total: sql<number>`count(*)::int`,
    })
    .from(ambassadors)
    .groupBy(ambassadors.countryCode, ambassadors.country)
    .orderBy(desc(sql`count(*)`), ambassadors.country);

  const nigerian = filter.countryCode === "NG";
  const states = nigerian
    ? filter.zone
      ? statesInZone(filter.zone)
      : NIGERIA_STATES.map((row) => row.name)
    : [];
  const lgas = nigerian && filter.state ? lgasForState(filter.state).filter((name) => name !== "Not applicable") : [];
  const wards = nigerian && filter.state && filter.lga ? await listWards(filter.state, filter.lga) : [];
  const pollingUnits =
    nigerian && filter.state && filter.lga && filter.ward
      ? await listPollingUnits(filter.state, filter.lga, filter.ward)
      : [];

  return {
    countries,
    zones: nigerian ? [...GEO_POLITICAL_ZONES] : [],
    states,
    lgas,
    wards,
    pollingUnits,
  };
}

export async function membershipBreakdown(filter: MembershipPlaceFilter): Promise<{
  label: string;
  rows: CountChip[];
}> {
  const db = getDb();
  if (!filter.countryCode) {
    const rows = await db
      .select({
        name: ambassadors.country,
        code: ambassadors.countryCode,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .groupBy(ambassadors.country, ambassadors.countryCode)
      .orderBy(desc(sql`count(*)`), ambassadors.country);
    return {
      label: "By country",
      rows: rows.map((row) => ({
        name: `${row.name} (${row.code})`,
        total: Number(row.total),
        href: hrefFor({ countryCode: row.code }),
      })),
    };
  }

  if (filter.countryCode !== "NG") {
    const rows = await db
      .select({
        name: ambassadors.region,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(eq(ambassadors.countryCode, filter.countryCode))
      .groupBy(ambassadors.region)
      .orderBy(desc(sql`count(*)`));
    return {
      label: "By region",
      rows: rows
        .filter((row) => row.name)
        .map((row) => ({
          name: row.name as string,
          total: Number(row.total),
          href: hrefFor({ countryCode: filter.countryCode }),
        })),
    };
  }

  if (!filter.zone) {
    const rows = await db
      .select({
        name: ambassadors.geoPoliticalZone,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(eq(ambassadors.countryCode, "NG"))
      .groupBy(ambassadors.geoPoliticalZone);
    const map = new Map(rows.filter((row) => row.name).map((row) => [row.name as string, Number(row.total)]));
    return {
      label: "By geo-political zone",
      rows: GEO_POLITICAL_ZONES.map((name) => ({
        name,
        total: map.get(name) ?? 0,
        href: hrefFor({ countryCode: "NG", zone: name }),
      })),
    };
  }

  if (!filter.state) {
    const rows = await db
      .select({
        name: ambassadors.stateOfOrigin,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(and(eq(ambassadors.countryCode, "NG"), eq(ambassadors.geoPoliticalZone, filter.zone)))
      .groupBy(ambassadors.stateOfOrigin);
    const map = new Map(rows.filter((row) => row.name).map((row) => [row.name as string, Number(row.total)]));
    return {
      label: "By state",
      rows: statesInZone(filter.zone).map((name) => ({
        name,
        total: map.get(name) ?? 0,
        href: hrefFor({ countryCode: "NG", zone: filter.zone, state: name }),
      })),
    };
  }

  if (!filter.lga) {
    const rows = await db
      .select({
        name: ambassadors.localGovernment,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(and(eq(ambassadors.countryCode, "NG"), eq(ambassadors.stateOfOrigin, filter.state)))
      .groupBy(ambassadors.localGovernment);
    const map = new Map(rows.filter((row) => row.name).map((row) => [row.name as string, Number(row.total)]));
    const names = lgasForState(filter.state).filter((name) => name !== "Not applicable");
    return {
      label: "By LGA",
      rows: names.map((name) => ({
        name,
        total: map.get(name) ?? 0,
        href: hrefFor({ countryCode: "NG", zone: filter.zone, state: filter.state, lga: name }),
      })),
    };
  }

  if (!filter.ward) {
    const rows = await db
      .select({
        name: ambassadors.electoralWard,
        total: sql<number>`count(*)::int`,
      })
      .from(ambassadors)
      .where(
        and(
          eq(ambassadors.countryCode, "NG"),
          eq(ambassadors.stateOfOrigin, filter.state),
          eq(ambassadors.localGovernment, filter.lga),
        ),
      )
      .groupBy(ambassadors.electoralWard);
    return {
      label: "By electoral ward (members only)",
      rows: rows
        .filter((row) => row.name)
        .map((row) => ({
          name: row.name as string,
          total: Number(row.total),
          href: hrefFor({
            countryCode: "NG",
            zone: filter.zone,
            state: filter.state,
            lga: filter.lga,
            ward: row.name as string,
          }),
        }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    };
  }

  const rows = await db
    .select({
      name: ambassadors.pollingUnit,
      total: sql<number>`count(*)::int`,
    })
    .from(ambassadors)
    .where(
      and(
        eq(ambassadors.countryCode, "NG"),
        eq(ambassadors.stateOfOrigin, filter.state),
        eq(ambassadors.localGovernment, filter.lga),
        eq(ambassadors.electoralWard, filter.ward),
      ),
    )
    .groupBy(ambassadors.pollingUnit);
  return {
    label: "By polling unit (members only)",
    rows: rows
      .filter((row) => row.name)
      .map((row) => ({
        name: row.name as string,
        total: Number(row.total),
        href: hrefFor({
          countryCode: "NG",
          zone: filter.zone,
          state: filter.state,
          lga: filter.lga,
          ward: filter.ward,
          pu: row.name as string,
        }),
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
  };
}

export async function listFilteredMembers(filter: MembershipPlaceFilter) {
  const clauses = filterClauses(filter);
  const query = getDb().select().from(ambassadors);
  const rows = clauses.length
    ? await query.where(and(...clauses)).orderBy(desc(ambassadors.createdAt))
    : await query.orderBy(desc(ambassadors.createdAt));
  return rows;
}
