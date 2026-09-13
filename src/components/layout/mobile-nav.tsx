"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { LanguageOption, NavItem } from "@/db/schema/settings";

export function MobileNav({
  primaryItems,
  exploreItems,
  donateHref,
  donateLabel,
  accountHref,
  accountLabel,
  languages,
  locale,
}: {
  primaryItems: NavItem[];
  exploreItems: NavItem[];
  donateHref: string;
  donateLabel: string;
  accountHref: string;
  accountLabel: string;
  languages: LanguageOption[];
  locale: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        className="rounded-md p-2 text-brand"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-brand/10 bg-canvas px-4 py-4 shadow-lg"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {primaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-medium text-ink"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {exploreItems.length ? (
              <div className="mt-2 border-t border-brand/10 pt-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">Explore</p>
                <div className="mt-2 flex flex-col gap-3">
                  {exploreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-base font-medium text-ink"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>
          <div className="mt-4">
            <LanguageSwitcher languages={languages} current={locale} />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <ButtonLink href={accountHref} variant="ghost" className="min-h-11 justify-center">
              {accountLabel}
            </ButtonLink>
            <ButtonLink href={donateHref} variant="sunshine" className="min-h-11 justify-center">
              {donateLabel}
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
