"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="xl:hidden" ref={rootRef}>
      <button
        type="button"
        className="btn btn-flat rounded-md p-2 text-brand shadow-none"
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
          className="absolute inset-x-0 top-full border-b border-brand/10 bg-canvas px-4 py-3 shadow-lg"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) close();
          }}
        >
          <nav className="flex flex-col gap-1.5" aria-label="Mobile">
            {primaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-1 py-1.5 text-sm font-medium text-ink"
                onClick={close}
              >
                {item.label}
              </Link>
            ))}
            {exploreItems.length ? (
              <div className="mt-1 border-t border-brand/10 pt-2">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">Explore</p>
                <div className="mt-1 flex flex-col gap-1">
                  {exploreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-1 py-1.5 text-sm font-medium text-ink"
                      onClick={close}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>
          <div className="mt-3">
            <LanguageSwitcher languages={languages} current={locale} />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <ButtonLink href={accountHref} variant="ghost" size="sm" className="justify-center">
              {accountLabel}
            </ButtonLink>
            <ButtonLink href={donateHref} variant="sunshine" size="sm" className="justify-center">
              {donateLabel}
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
