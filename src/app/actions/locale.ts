"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveLanguages } from "@/lib/locale";
import { LOCALE_COOKIE, isLocaleCode } from "@/lib/locale-cookie";

export async function setLocale(formData: FormData) {
  const requested = String(formData.get("locale") ?? "").trim().toLowerCase();
  const languages = await getActiveLanguages();
  const locale =
    isLocaleCode(requested) && languages.some((language) => language.code === requested)
      ? requested
      : languages.find((language) => language.isDefault)?.code ?? "en";
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
