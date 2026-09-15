import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { Card } from "@/components/ui/card";
import { getCountryCounts, getDirectoryAmbassadors } from "@/lib/content/ambassadors";
import { NetworkMap } from "@/components/network-map";
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
        <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:gap-4 lg:grid-cols-3">
          {counts.map((row) => (
            <Link key={row.countryCode} href={`/love-ambassadors/network/${row.countryCode}`}>
              <Card className="group p-3 sm:p-5">
                <p className="text-xs text-muted sm:text-sm">{row.country}</p>
                <p className="mt-1 font-display text-2xl text-brand sm:mt-2 sm:text-4xl">{row.total}</p>
                <p className="mt-1 text-[10px] font-semibold tracking-wide text-accent uppercase sm:text-xs">Explore country network →</p>
              </Card>
            </Link>
          ))}
        </div>
        <h2 className="editorial-rule mt-10 font-display text-2xl sm:mt-20 sm:text-3xl">Meet consenting ambassadors</h2>
        <ul className="mt-4 grid gap-2 md:grid-cols-2 md:gap-3">
          {directory.map((person) => (
            <li key={person.id} className="rounded-md border border-brand/10 bg-paper p-3 sm:rounded-lg sm:p-5 sm:shadow-sm">
              <p className="font-semibold">{person.fullName}</p>
              <p className="text-sm text-muted">
                {person.region ? `${person.region}, ` : ""}
                {person.country}
                {person.profession ? ` · ${person.profession}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
