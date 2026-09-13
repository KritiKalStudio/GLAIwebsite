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
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">Global Ambassador Network</h1>
        <p className="mt-4 max-w-2xl text-paper/85">
          Every approved Ambassador is counted. Only people who opted in from their dashboard appear by name.
        </p>
      </Section>
      <Section>
        <NetworkMap counts={counts} token={token} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map((row) => (
            <Link key={row.countryCode} href={`/love-ambassadors/network/${row.countryCode}`}>
              <Card className="group p-5">
                <p className="text-sm text-muted">{row.country}</p>
                <p className="mt-2 font-display text-4xl text-brand">{row.total}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-accent uppercase">Explore country network →</p>
              </Card>
            </Link>
          ))}
        </div>
        <h2 className="editorial-rule mt-20 font-display text-3xl">Meet consenting ambassadors</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {directory.map((person) => (
            <li key={person.id} className="rounded-lg border border-brand/10 bg-paper p-5 shadow-sm">
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
