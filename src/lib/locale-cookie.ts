export const LOCALE_COOKIE = "glai_locale";
export const LOCALE_HEADER = "x-glai-locale";

const RTL = new Set(["ar", "he", "fa", "ur"]);

export function isLocaleCode(value: string | null | undefined): value is string {
  return Boolean(value && /^[a-z]{2}$/.test(value));
}

export function localeDirection(locale: string): "ltr" | "rtl" {
  return RTL.has(locale) ? "rtl" : "ltr";
}
