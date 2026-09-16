import { Kicker, Section } from "@/components/blocks/section";
import { AmbassadorDirectoryTable, CountryCountsTable } from "@/components/network-directory";
import { NetworkMap } from "@/components/network-map";
import { getCountryCounts, getDirectoryAmbassadors } from "@/lib/content/ambassadors";
import { optionalEnv } from "@/lib/env";


export const metadata = {
  title: "Global Ambassador Network",
  description: "Country counts of Love Ambassadors. Named profiles appear only with consent.",
};

export default async function NetworkPage() {
  const [counts, directory] = await Promise.all([
    getCountryCounts(),
    getDirectoryAmbassadors(),
  ]);
  const token = optionalEnv("NEXT_PUBLIC_MAPBOX_TOKEN");

  return (
    <>
      <Section className="surface-grid bg-brand text-paper">
        <Kicker>Network</Kicker>
        <h1 className="mt-3 max-w-3xl font-display text-[1.85rem] leading-tight sm:text-5xl">Global Ambassador Network</h1>
        <p className="mt-3 max-w-2xl text-sm text-paper/85 sm:mt-4 sm:text-base">
          Every approved Ambassador is counted. Only people who opted in from their dashboard appear by name.
        </p>
      </Section>
      <Section>
        <NetworkMap counts={counts} token={token} />
        <h2 className="editorial-rule mt-10 font-display text-2xl sm:mt-16 sm:text-3xl">Ambassadors by country</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Totals include every approved ambassador. Open a country to see its consenting public profiles.
        </p>
        <div className="mt-4">
          <CountryCountsTable rows={counts} />
        </div>
        <h2 className="editorial-rule mt-10 font-display text-2xl sm:mt-16 sm:text-3xl">Meet consenting ambassadors</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Named profiles appear only when an ambassador has opted in from their dashboard.
        </p>
        <div className="mt-4">
          <AmbassadorDirectoryTable rows={directory} />
        </div>
      </Section>
    </>
  );
}
