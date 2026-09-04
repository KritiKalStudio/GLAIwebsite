import { cookies, headers } from "next/headers";
import { getSiteSettings } from "@/lib/content/settings";
import type { LanguageOption } from "@/db/schema/settings";
import { LOCALE_COOKIE, LOCALE_HEADER, isLocaleCode } from "@/lib/locale-cookie";

export { LOCALE_COOKIE, LOCALE_HEADER, isLocaleCode, localeDirection } from "@/lib/locale-cookie";

export async function getActiveLanguages(): Promise<LanguageOption[]> {
  const settings = await getSiteSettings();
  const languages = settings?.languages ?? [
    { code: "en", name: "English", isDefault: true, isActive: true },
  ];
  const active = languages.filter((language) => language.isActive !== false);
  return active.length ? active : languages;
}

export async function getDefaultLocale(): Promise<string> {
  const languages = await getActiveLanguages();
  return languages.find((language) => language.isDefault)?.code ?? languages[0]?.code ?? "en";
}

export async function getRequestLocale(): Promise<string> {
  const headerList = await headers();
  const fromHeader = headerList.get(LOCALE_HEADER);
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  const candidate = isLocaleCode(fromHeader)
    ? fromHeader
    : isLocaleCode(fromCookie)
      ? fromCookie
      : null;
  const languages = await getActiveLanguages();
  if (candidate && languages.some((language) => language.code === candidate)) {
    return candidate;
  }
  return languages.find((language) => language.isDefault)?.code ?? "en";
}
