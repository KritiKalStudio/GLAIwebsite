import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { pageBlocks, pages } from "@/db/schema";
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

export async function getPublishedPage(slug: string, locale?: string) {
  const requested = await resolveLocale(locale);
  const page =
    (await loadPage(slug, requested, ["published"] as const)) ??
    (requested === "en" ? null : await loadPage(slug, await getDefaultLocale(), ["published"] as const));
  if (!page) return null;
  const blocks = await getDb()
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, page.id))
    .orderBy(asc(pageBlocks.sortOrder));
  return { ...page, blocks };
}

export async function getPageBySlugForPreview(slug: string, locale?: string) {
  const requested = await resolveLocale(locale);
  return (
    (await loadPage(slug, requested, liveStatuses)) ??
    (requested === "en" ? null : await loadPage(slug, await getDefaultLocale(), liveStatuses))
  );
}
