import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker, Section } from "@/components/blocks/section";
import { getCountryCounts, getDirectoryAmbassadors } from "@/lib/content/ambassadors";
import { getProjectsByCountry } from "@/lib/content/programs";


export default async function CountryNetworkPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const code = country.toUpperCase();
  const [counts, directory, projects] = await Promise.all([
    getCountryCounts(),
    getDirectoryAmbassadors(code),
    getProjectsByCountry(code),
  ]);
  const summary = counts.find((row) => row.countryCode === code);
  if (!summary) notFound();

  return (
    <Section>
      <Kicker>Network</Kicker>
      <h1 className="mt-3 font-display text-4xl">{summary.country}</h1>
      <p className="mt-3 text-muted">
        {summary.total} approved ambassadors counted. {directory.length} appear by name with consent.
      </p>
      <ul className="mt-8 space-y-3">
        {directory.map((person) => (
          <li key={person.id} className="rounded-md border border-brand/10 bg-paper p-4">
            <p className="font-semibold">{person.fullName}</p>
            <p className="text-sm text-muted">
              {person.region} {person.profession ? `· ${person.profession}` : ""}
            </p>
          </li>
        ))}
      </ul>
      {projects.length ? (
        <>
          <h2 className="mt-12 font-display text-2xl">Projects in this country</h2>
          <ul className="mt-4 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link className="text-brand underline" href={`/impact/${project.slug}`}>
                  {project.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-10">
        <Link href="/love-ambassadors/network" className="text-sm text-accent">
          ← All countries
        </Link>
      </p>
    </Section>
  );
}
