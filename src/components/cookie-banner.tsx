"use client";

import Link from "next/link";
import { setCookieConsent } from "@/app/actions/consent";
import { Button } from "@/components/ui/button";

export function CookieBanner({ hasChoice }: { hasChoice: boolean }) {
  if (hasChoice) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-copy"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand/15 bg-paper/95 p-2.5 shadow-lg backdrop-blur sm:p-4"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="max-w-2xl">
          <p id="cookie-banner-title" className="font-display text-sm text-brand sm:text-lg">
            Cookies
          </p>
          <p id="cookie-banner-copy" className="mt-0.5 text-xs leading-snug text-muted sm:mt-1 sm:text-sm">
            We use a necessary language cookie and a sign-in cookie if you log in. Optional analytics
            cookies load only if you agree. Read the{" "}
            <Link className="text-accent underline" href="/legal/cookies">
              cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <form action={setCookieConsent}>
            <input type="hidden" name="consent" value="necessary" />
            <Button type="submit" variant="outline" size="sm">
              Necessary only
            </Button>
          </form>
          <form action={setCookieConsent}>
            <input type="hidden" name="consent" value="all" />
            <Button type="submit" size="sm">
              Accept analytics
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
