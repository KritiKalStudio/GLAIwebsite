import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events, programs, projects, stories } from "@/db/schema";
import { legalPages } from "@/lib/content/legal";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const db = getDb();
  const [programRows, projectRows, storyRows, eventRows] = await Promise.all([
    db.select({ slug: programs.slug, updatedAt: programs.updatedAt }).from(programs).where(eq(programs.status, "published")),
    db.select({ slug: projects.slug, updatedAt: projects.lastUpdated }).from(projects).where(eq(projects.status, "published")),
    db.select({ slug: stories.slug, updatedAt: stories.updatedAt }).from(stories).where(eq(stories.status, "published")),
    db.select({ slug: events.slug, updatedAt: events.updatedAt }).from(events).where(eq(events.status, "published")),
  ]);

  const staticRoutes = [
    "/",
    "/about",
    "/our-work",
    "/impact",
    "/love-ambassadors",
    "/signup",
    "/love-ambassadors/network",
    "/get-involved",
    "/get-involved/volunteer",
    "/get-involved/partner",
    "/stories",
    "/podcast",
    "/events",
    "/donate",
    "/contact",
    "/faq",
    "/resources",
    "/careers",
    "/transparency",
    ...Object.keys(legalPages).map((slug) => `/legal/${slug}`),
  ];

  const withFrench = (
    url: string,
    lastModified: Date,
  ): MetadataRoute.Sitemap[number] => ({
    url,
    lastModified,
    alternates: { languages: { fr: `${url}${url.includes("?") ? "&" : "?"}lang=fr` } },
  });

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((path) =>
      withFrench(path === "/" ? base : `${base}${path}`, new Date()),
    ),
    ...programRows.map((row) => withFrench(`${base}/our-work/${row.slug}`, row.updatedAt)),
    ...projectRows.map((row) => withFrench(`${base}/impact/${row.slug}`, row.updatedAt)),
    ...storyRows.map((row) => withFrench(`${base}/stories/${row.slug}`, row.updatedAt)),
    ...eventRows.map((row) => withFrench(`${base}/events/${row.slug}`, row.updatedAt)),
  ];

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
