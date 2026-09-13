import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { faqItems, impactStats, people, siteSettings } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { rewriteLegacyApplyHref, rewriteNavHrefs } from "@/lib/nav";

type SiteSettings = typeof siteSettings.$inferSelect;

function sanitizeSiteSettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    navigation: rewriteNavHrefs(settings.navigation ?? []),
    headerCtas: {
      ...settings.headerCtas,
      donateHref: rewriteLegacyApplyHref(settings.headerCtas?.donateHref ?? "/donate"),
      joinHref: rewriteLegacyApplyHref(settings.headerCtas?.joinHref ?? "/love-ambassadors"),
    },
    footer: {
      ...settings.footer,
      columns: (settings.footer?.columns ?? []).map((column) => ({
        ...column,
        links: (column.links ?? []).map((link) => ({
          ...link,
          href: rewriteLegacyApplyHref(link.href),
        })),
      })),
      legalLinks: (settings.footer?.legalLinks ?? []).map((link) => ({
        ...link,
        href: rewriteLegacyApplyHref(link.href),
      })),
    },
  };
}

const loadSiteSettings = cached("site-settings", [CACHE_TAGS.settings], async () => {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);
  return settings ?? null;
});

export async function getSiteSettings() {
  const settings = await loadSiteSettings();
  return settings ? sanitizeSiteSettings(settings) : null;
}

export const getPublishedPeople = cached("published-people", [CACHE_TAGS.people], async () => {
  const db = getDb();
  const rows = await db
    .select()
    .from(people)
    .where(eq(people.status, "published"))
    .orderBy(people.sortOrder, people.createdAt);
  const seen = new Set<string>();
  return rows.filter((person) => {
    const key = `${person.name}\0${person.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

export const getPublicImpactStats = cached("public-impact-stats", [CACHE_TAGS.impact], async () => {
  const db = getDb();
  return db
    .select()
    .from(impactStats)
    .where(eq(impactStats.isPublic, true))
    .orderBy(impactStats.sortOrder);
});

const loadPublishedFaqs = cached("published-faqs", [CACHE_TAGS.faqs], async () => {
  const db = getDb();
  return db
    .select()
    .from(faqItems)
    .where(eq(faqItems.status, "published"))
    .orderBy(faqItems.sortOrder);
});

export async function getPublishedFaqs(audience?: string) {
  const rows = await loadPublishedFaqs();
  if (!audience) return rows;
  return rows.filter((row) => row.audience === audience || row.audience === "general");
}
