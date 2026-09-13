import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/content/settings";
import { getActiveLanguages, getRequestLocale } from "@/lib/locale";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { splitSiteNav } from "@/lib/nav";
import { Mail, Phone } from "lucide-react";

export async function Header() {
  const [settings, user, languages, locale] = await Promise.all([
    getSiteSettings(),
    getSessionUser(),
    getActiveLanguages(),
    getRequestLocale(),
  ]);
  const { primaryNav, exploreNav } = splitSiteNav(settings?.navigation ?? []);
  const ctas = settings?.headerCtas ?? {
    donateLabel: "Donate",
    donateHref: "/donate",
    joinLabel: "Become a Love Ambassador",
    joinHref: "/love-ambassadors",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand/10 bg-canvas/95 shadow-[0_10px_30px_-28px_rgba(6,29,75,.75)] backdrop-blur-xl">
      <div className="hidden bg-brand text-paper md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] font-medium tracking-wide lg:px-8">
          <p className="text-paper/80">Global Love Ambassadors Initiative · Love in public.</p>
          <div className="flex items-center gap-5 text-paper/80">
            {settings?.contact.email ? <a className="inline-flex items-center gap-1.5 hover:text-sunshine" href={`mailto:${settings.contact.email}`}><Mail size={13} /> {settings.contact.email}</a> : null}
            {settings?.contact.phone ? <a className="inline-flex items-center gap-1.5 hover:text-sunshine" href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}><Phone size={13} /> {settings.contact.phone}</a> : null}
            <Link className="font-semibold text-sunshine hover:text-paper" href="/transparency">Transparency center</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 group" aria-label="Global Love Ambassadors Initiative home">
          <Image src="/glai-mark.png" width={50} height={42} priority alt="" className="h-10 w-12 object-cover object-top mix-blend-multiply" />
          <span className="font-display text-2xl font-bold tracking-[-.06em] text-brand sm:text-[1.65rem]">GLAI</span>
        </Link>
        <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[13px] font-semibold text-ink/75 transition hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
          {exploreNav.length ? (
            <details className="group relative">
              <summary className="cursor-pointer list-none text-[13px] font-semibold text-ink/75 marker:hidden hover:text-brand">
                Explore <span className="ml-1 text-accent">+</span>
              </summary>
              <div className="absolute right-0 top-8 grid w-52 gap-1 rounded-xl border border-brand/10 bg-paper p-2 shadow-xl">
                {exploreNav.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-mist hover:text-brand">
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
        </nav>
        <div className="hidden items-center gap-3 xl:flex">
          <LanguageSwitcher languages={languages} current={locale} />
          {user ? (
            <ButtonLink href={user.roleSlug ? "/admin" : "/dashboard"} variant="ghost" size="sm">
              {user.roleSlug ? "Admin" : "Dashboard"}
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="ghost" size="sm">
              Sign in
            </ButtonLink>
          )}
          <ButtonLink href={ctas.donateHref} variant="sunshine" size="sm" className="whitespace-nowrap">
            {ctas.donateLabel}
          </ButtonLink>
        </div>
        <MobileNav
          primaryItems={primaryNav}
          exploreItems={exploreNav}
          donateHref={ctas.donateHref}
          donateLabel={ctas.donateLabel}
          accountHref={user ? (user.roleSlug ? "/admin" : "/dashboard") : "/login"}
          accountLabel={user ? (user.roleSlug ? "Admin" : "Dashboard") : "Sign in"}
          languages={languages}
          locale={locale}
        />
      </div>
    </header>
  );
}
