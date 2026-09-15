import Link from "next/link";
import Image from "next/image";
import { getSiteSettings } from "@/lib/content/settings";
import { subscribeNewsletter } from "@/app/actions/public";
import { Button } from "@/components/ui/button";

export async function Footer() {
  const settings = await getSiteSettings();
  const footer = settings?.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto overflow-hidden border-t border-brand/10 bg-brand text-paper">
      <div className="relative mx-auto grid max-w-7xl grid-cols-3 gap-x-3 gap-y-3 px-4 py-4 lg:grid-cols-4 lg:gap-10 lg:px-8 lg:py-16">
        <div aria-hidden="true" className="absolute -right-24 -top-28 hidden h-80 w-80 rounded-full border border-paper/10 md:block" />
        <div className="col-span-3 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/glai-mark.png" width={54} height={46} alt="" className="h-7 w-7 rounded-full bg-paper object-cover object-top sm:h-11 sm:w-11" />
            <span className="font-display text-lg font-bold tracking-[-.06em] text-paper sm:text-2xl">GLAI</span>
          </div>
        </div>
        {footer?.columns.map((column) => (
          <div key={column.title}>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-sunshine uppercase sm:text-xs">
              {column.title}
            </p>
            <ul className="mt-1.5 space-y-1 sm:mt-4 sm:space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link className="text-[11px] leading-snug text-paper/85 hover:text-paper sm:text-sm" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-6">
          <form action={subscribeNewsletter} className="flex w-full max-w-md gap-2">
            <label className="sr-only" htmlFor="newsletter-email">
              {footer?.newsletterLabel ?? "Stay connected"}
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder={footer?.newsletterPlaceholder ?? "Your email address"}
              className="min-w-0 flex-1 rounded-full border border-paper/20 bg-paper/10 px-3 py-2 text-sm text-paper placeholder:text-paper/60 sm:px-4"
            />
            <Button type="submit" variant="sunshine" size="sm">
              {footer?.newsletterLabel ?? "Stay connected"}
            </Button>
          </form>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper/70">
            {footer?.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-paper">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="px-4 pb-3 text-center text-[11px] text-paper/55 sm:pb-8 sm:text-xs lg:px-6">
          © {year} {footer?.copyright ?? "Global Love Ambassadors Initiative. All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
