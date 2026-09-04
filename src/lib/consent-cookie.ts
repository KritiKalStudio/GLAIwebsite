export const CONSENT_COOKIE = "glai_cookie_consent";

export type CookieConsent = "necessary" | "all";

export function isCookieConsent(value: string | null | undefined): value is CookieConsent {
  return value === "necessary" || value === "all";
}
