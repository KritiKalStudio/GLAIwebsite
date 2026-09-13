import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, programs, projects } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";
import { rewriteLegacyApplyHref } from "@/lib/nav";

function rewriteProgramApply<T extends { applyHref: string | null }>(program: T): T {
  if (!program.applyHref) return program;
  return { ...program, applyHref: rewriteLegacyApplyHref(program.applyHref) };
}

export function isCampaignActive(program: {
  status: string;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
}) {
  if (program.status !== "published") return false;
  const now = Date.now();
  if (program.startsAt && new Date(program.startsAt).getTime() > now) return false;
  if (program.endsAt && new Date(program.endsAt).getTime() < now) return false;
  return true;
}

export function campaignWindowLabel(program: {
  startsAt: Date | string | null;
  endsAt: Date | string | null;
}) {
  const start = program.startsAt ? new Date(program.startsAt) : null;
  const end = program.endsAt ? new Date(program.endsAt) : null;
  if (!start && !end) return "Open-ended";
  const fmt = (value: Date) =>
    value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

const loadPublishedPrograms = cached(
  "published-programs",
  [CACHE_TAGS.programs],
  async (locale: string) => {
    const db = getDb();
    return db
      .select()
      .from(programs)
      .where(and(eq(programs.status, "published"), eq(programs.locale, locale)))
      .orderBy(asc(programs.sortOrder));
  },
);

export async function getPublishedPrograms() {
  const locale = await getRequestLocale();
  const rows = await loadPublishedPrograms(locale);
  if (rows.length) return rows.map(rewriteProgramApply);
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows.map(rewriteProgramApply);
  return (await loadPublishedPrograms(fallback)).map(rewriteProgramApply);
}

const loadPublishedProgram = cached("published-program", [CACHE_TAGS.programs], async (slug: string) => {
  const db = getDb();
  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.slug, slug), eq(programs.status, "published")))
    .limit(1);
  return program ?? null;
});

export async function getPublishedProgram(slug: string) {
  const program = await loadPublishedProgram(slug);
  return program ? rewriteProgramApply(program) : null;
}

export async function getActivePrograms() {
  return (await getPublishedPrograms()).filter((program) => isCampaignActive(program));
}

export async function getRaisedByProgramIds(ids: string[]) {
  const raised: Record<string, number> = {};
  if (!ids.length) return raised;
  const rows = await getDb()
    .select({
      programId: donations.programId,
      total: sql<string>`coalesce(sum(${donations.amount}::numeric), 0)`,
    })
    .from(donations)
    .where(and(inArray(donations.programId, ids), eq(donations.status, "completed")))
    .groupBy(donations.programId);
  for (const row of rows) {
    if (row.programId) raised[row.programId] = Number(row.total) || 0;
  }
  return raised;
}

export async function getActiveProgramsWithRaised() {
  const active = await getActivePrograms();
  const raised = await getRaisedByProgramIds(active.map((program) => program.id));
  return active.map((program) => ({
    ...program,
    raised: raised[program.id] ?? 0,
  }));
}

const loadPublishedProjects = cached(
  "published-projects",
  [CACHE_TAGS.projects],
  async (locale: string) => {
    const db = getDb();
    return db
      .select()
      .from(projects)
      .where(and(eq(projects.status, "published"), eq(projects.locale, locale)))
      .orderBy(asc(projects.lastUpdated));
  },
);

export async function getPublishedProjects() {
  const locale = await getRequestLocale();
  const rows = await loadPublishedProjects(locale);
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return loadPublishedProjects(fallback);
}

export const getPublishedProject = cached("published-project", [CACHE_TAGS.projects], async (slug: string) => {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
    .limit(1);
  return project ?? null;
});

export const getProjectsByCountry = cached(
  "projects-by-country",
  [CACHE_TAGS.projects],
  async (countryCode: string) => {
    const db = getDb();
    return db
      .select()
      .from(projects)
      .where(and(eq(projects.countryCode, countryCode), eq(projects.status, "published")));
  },
);
