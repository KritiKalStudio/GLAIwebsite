import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { pageBlocks, pages } from "@/db/schema";
import { CACHE_TAGS, cached } from "@/lib/cache";
import { getDefaultLocale, getRequestLocale } from "@/lib/locale";

type PageStatus = "draft" | "preview" | "published" | "archived";
const liveStatuses: PageStatus[] = ["published", "preview"];

async function loadPage(slug: string, locale: string, statuses: readonly PageStatus[]) {
  const db = getDb();
  const [page] = await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.slug, slug),
        eq(pages.locale, locale),
        inArray(pages.status, statuses),
      ),
    )
    .limit(1);
  return page ?? null;
}

async function resolveLocale(explicit?: string) {
  return explicit ?? (await getRequestLocale());
}

const loadPublishedPage = cached(
  "published-page",
  [CACHE_TAGS.pages],
  async (slug: string, locale: string, defaultLocale: string) => {
    const page =
      (await loadPage(slug, locale, ["published"] as const)) ??
      (locale === defaultLocale ? null : await loadPage(slug, defaultLocale, ["published"] as const));
    if (!page) return null;
    const blocks = await getDb()
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, page.id))
      .orderBy(asc(pageBlocks.sortOrder));
    return { ...page, blocks };
  },
);

export async function getPublishedPage(slug: string, locale?: string) {
  const requested = await resolveLocale(locale);
  const defaultLocale = await getDefaultLocale();
  return loadPublishedPage(slug, requested, defaultLocale);
}

export async function getPageBySlugForPreview(slug: string, locale?: string) {
  const requested = await resolveLocale(locale);
  return (
    (await loadPage(slug, requested, liveStatuses)) ??
    (requested === "en" ? null : await loadPage(slug, await getDefaultLocale(), liveStatuses))
  );
}
