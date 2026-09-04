import Link from "next/link";
import Image from "next/image";
import { getSiteSettings } from "@/lib/content/settings";
import { subscribeNewsletter } from "@/app/actions/public";

export async function Footer() {
  const settings = await getSiteSettings();
  const footer = settings?.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto overflow-hidden border-t border-brand/10 bg-brand text-paper">
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-paper/10" />
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3"><Image src="/glai-mark.png" width={54} height={46} alt="" className="h-11 w-11 rounded-full bg-paper object-cover object-top" /><span className="font-display text-2xl font-bold tracking-[-.06em] text-paper">GLAI</span></div>
        </div>
        {footer?.columns.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-semibold tracking-[0.18em] text-sunshine uppercase">
              {column.title}
            </p>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link className="text-sm text-paper/85 hover:text-paper" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
              className="min-w-0 flex-1 rounded-full border border-paper/20 bg-paper/10 px-4 py-2 text-sm text-paper placeholder:text-paper/60"
            />
            <button
              type="submit"
              className="rounded-full bg-sunshine px-4 py-2 text-sm font-semibold text-ink"
            >
              {footer?.newsletterLabel ?? "Stay connected"}
            </button>
          </form>
          <div className="flex flex-wrap gap-4 text-xs text-paper/70">
            {footer?.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-paper">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="px-4 pb-8 text-center text-xs text-paper/55 lg:px-6">
          © {year} {footer?.copyright ?? "Global Love Ambassadors Initiative. All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
