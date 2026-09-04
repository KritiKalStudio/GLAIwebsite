import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events, pages, programs, projects, stories } from "@/db/schema";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const db = getDb();
  const [pageRows, programRows, projectRows, storyRows, eventRows] = await Promise.all([
    db
      .select({ slug: pages.slug, locale: pages.locale, updatedAt: pages.updatedAt })
      .from(pages)
      .where(eq(pages.status, "published")),
    db.select({ slug: programs.slug, updatedAt: programs.updatedAt }).from(programs).where(eq(programs.status, "published")),
    db.select({ slug: projects.slug, updatedAt: projects.lastUpdated }).from(projects).where(eq(projects.status, "published")),
    db.select({ slug: stories.slug, updatedAt: stories.updatedAt }).from(stories).where(eq(stories.status, "published")),
    db.select({ slug: events.slug, updatedAt: events.updatedAt }).from(events).where(eq(events.status, "published")),
  ]);

  const pagesBySlug = new Map<string, { updatedAt: Date; locales: string[] }>();
  for (const row of pageRows) {
    const current = pagesBySlug.get(row.slug);
    if (current) {
      current.locales.push(row.locale);
      if (row.updatedAt > current.updatedAt) current.updatedAt = row.updatedAt;
    } else {
      pagesBySlug.set(row.slug, { updatedAt: row.updatedAt, locales: [row.locale] });
    }
  }

  function withLocales(url: string, locales: string[], lastModified: Date) {
    const unique = [...new Set(locales)];
    const languages = Object.fromEntries(
      unique.map((locale) => [locale, locale === "en" ? url : `${url}${url.includes("?") ? "&" : "?"}lang=${locale}`]),
    );
    return {
      url,
      lastModified,
      alternates: unique.length > 1 ? { languages } : undefined,
    };
  }

  const staticRoutes = [
    "/",
    "/about",
    "/our-work",
    "/impact",
    "/love-ambassadors",
    "/love-ambassadors/apply",
    "/love-ambassadors/network",
    "/get-involved",
    "/get-involved/volunteer",
    "/get-involved/partner",
    "/stories",
    "/events",
    "/donate",
    "/contact",
    "/faq",
    "/resources",
    "/careers",
    "/transparency",
  ];

  const entries: MetadataRoute.Sitemap = [
    ...[...pagesBySlug.entries()].map(([slug, row]) =>
      withLocales(slug === "home" ? base : `${base}/${slug}`, row.locales, row.updatedAt),
    ),
    ...staticRoutes.map((path) => ({
      url: path === "/" ? base : `${base}${path}`,
      lastModified: new Date(),
    })),
    ...programRows.map((row) => ({
      url: `${base}/our-work/${row.slug}`,
      lastModified: row.updatedAt,
    })),
    ...projectRows.map((row) => ({
      url: `${base}/impact/${row.slug}`,
      lastModified: row.updatedAt,
    })),
    ...storyRows.map((row) => ({
      url: `${base}/stories/${row.slug}`,
      lastModified: row.updatedAt,
    })),
    ...eventRows.map((row) => ({
      url: `${base}/events/${row.slug}`,
      lastModified: row.updatedAt,
    })),
  ];

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
