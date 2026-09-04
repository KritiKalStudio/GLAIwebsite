"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CONSENT_COOKIE, isCookieConsent } from "@/lib/consent-cookie";

export async function setCookieConsent(formData: FormData) {
  const requested = String(formData.get("consent") ?? "").trim();
  const consent = isCookieConsent(requested) ? requested : "necessary";
  const jar = await cookies();
  jar.set(CONSENT_COOKIE, consent, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
