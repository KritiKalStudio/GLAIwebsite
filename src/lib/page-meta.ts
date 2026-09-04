import type { Metadata } from "next";
import { getPublishedPage } from "@/lib/content/pages";
import { getSiteSettings } from "@/lib/content/settings";
import { getSiteUrl } from "@/lib/env";
import { getActiveLanguages, getDefaultLocale, getRequestLocale } from "@/lib/locale";

export async function pageMetadata(slug: string, fallbackTitle?: string): Promise<Metadata> {
  const [page, settings, locale, languages, defaultLocale] = await Promise.all([
    getPublishedPage(slug),
    getSiteSettings(),
    getRequestLocale(),
    getActiveLanguages(),
    getDefaultLocale(),
  ]);
  const title = page?.seoTitle ?? page?.title ?? fallbackTitle ?? settings?.defaultSeo.title;
  const description =
    page?.seoDescription ?? page?.description ?? settings?.defaultSeo.description ?? "";
  const path = slug === "home" ? "" : slug;
  const url = `${getSiteUrl()}/${path}`.replace(/\/$/, "") || getSiteUrl();
  const languagesMap = Object.fromEntries(
    languages.map((language) => [
      language.code,
      language.code === defaultLocale ? url : `${url}${path ? "?" : "/?"}lang=${language.code}`,
    ]),
  );

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languagesMap,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: settings?.orgName,
      locale: locale === "en" ? "en_US" : locale,
      type: "website",
      images: page?.ogImageUrl ? [{ url: page.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
