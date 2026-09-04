import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import { WebVitals } from "@/components/web-vitals";
import { getSiteUrl, optionalEnv } from "@/lib/env";
import { getRequestLocale } from "@/lib/locale";
import { localeDirection } from "@/lib/locale-cookie";
import "./globals.css";

const siteUrl = getSiteUrl();
const gsc = optionalEnv("NEXT_PUBLIC_GSC_VERIFICATION");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Global Love Ambassadors Initiative",
    template: "%s | GLAI",
  },
  description:
    "A global movement restoring love, unity, and peaceful coexistence. Join as a Love Ambassador, partner, or supporter.",
  verification: gsc ? { google: gsc } : undefined,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} dir={localeDirection(locale)} className="h-full antialiased">
      <body className="min-h-full bg-canvas font-sans text-ink">
        <WebVitals />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
