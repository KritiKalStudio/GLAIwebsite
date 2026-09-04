import Script from "next/script";
import { cookies } from "next/headers";
import { CONSENT_COOKIE } from "@/lib/consent-cookie";
import { optionalEnv } from "@/lib/env";

export async function Analytics() {
  const ga = optionalEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID");
  if (!ga) return null;
  const consent = (await cookies()).get(CONSENT_COOKIE)?.value;
  if (consent !== "all") return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
