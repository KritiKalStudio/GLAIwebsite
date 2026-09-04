import { cookies } from "next/headers";
import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MotionObserver } from "@/components/layout/motion-observer";
import { JsonLd } from "@/components/json-ld";
import { CONSENT_COOKIE, isCookieConsent } from "@/lib/consent-cookie";
import { getSiteSettings } from "@/lib/content/settings";
import { organizationJsonLd } from "@/lib/structured-data";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [settings, jar] = await Promise.all([getSiteSettings(), cookies()]);
  const hasChoice = isCookieConsent(jar.get(CONSENT_COOKIE)?.value);
  return (
    <div className="flex min-h-full flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <JsonLd data={organizationJsonLd(settings)} />
      <MotionObserver />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <CookieBanner hasChoice={hasChoice} />
    </div>
  );
}
