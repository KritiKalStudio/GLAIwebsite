import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { programs, projects } from "@/db/schema";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";

export async function getPublishedPrograms() {
  const db = getDb();
  const locale = await getRequestLocale();
  const rows = await db
    .select()
    .from(programs)
    .where(and(eq(programs.status, "published"), eq(programs.locale, locale)))
    .orderBy(asc(programs.sortOrder));
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return db
    .select()
    .from(programs)
    .where(and(eq(programs.status, "published"), eq(programs.locale, fallback)))
    .orderBy(asc(programs.sortOrder));
}

export async function getPublishedProgram(slug: string) {
  const db = getDb();
  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.slug, slug), eq(programs.status, "published")))
    .limit(1);
  return program ?? null;
}

export async function getPublishedProjects() {
  const db = getDb();
  const locale = await getRequestLocale();
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.status, "published"), eq(projects.locale, locale)))
    .orderBy(asc(projects.lastUpdated));
  if (rows.length) return rows;
  const fallback = await getDefaultLocale();
  if (fallback === locale) return rows;
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.status, "published"), eq(projects.locale, fallback)))
    .orderBy(asc(projects.lastUpdated));
}

export async function getPublishedProject(slug: string) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
    .limit(1);
  return project ?? null;
}

export async function getProjectsByCountry(countryCode: string) {
  const db = getDb();
  return db
    .select()
    .from(projects)
    .where(
      and(eq(projects.countryCode, countryCode), eq(projects.status, "published")),
    );
}
