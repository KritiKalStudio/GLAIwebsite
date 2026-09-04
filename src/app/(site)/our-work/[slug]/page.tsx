import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { MediaFrame } from "@/components/blocks/media-frame";
import { Kicker, Section } from "@/components/blocks/section";
import { JsonLd } from "@/components/json-ld";
import { getPublishedProgram } from "@/lib/content/programs";
import { getSiteSettings } from "@/lib/content/settings";
import { getSiteUrl } from "@/lib/env";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await getPublishedProgram(slug);
  return {
    title: program?.name ?? "Program",
    description: program?.shortDescription,
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [program, settings] = await Promise.all([getPublishedProgram(slug), getSiteSettings()]);
  if (!program) notFound();
  const url = `${getSiteUrl()}/our-work/${program.slug}`;
  const orgName = settings?.orgName ?? "Global Love Ambassadors Initiative";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOccupationalProgram",
          name: program.name,
          description: program.shortDescription,
          url,
          provider: { "@type": "NGO", name: orgName, url: getSiteUrl() },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: getSiteUrl() },
          { name: "Our Work", url: `${getSiteUrl()}/our-work` },
          { name: program.name, url },
        ])}
      />
      <Section className="bg-brand text-paper">
        <Kicker>Our Work</Kicker>
        <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-5xl">{program.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-paper/85">{program.shortDescription}</p>
        {program.applyHref ? (
          <ButtonLink href={program.applyHref} variant="sunshine" className="mt-8">
            {program.applyCtaLabel ?? "Take part"}
          </ButtonLink>
        ) : null}
      </Section>
      <MediaFrame
        src={program.featuredImageUrl}
        youtubeUrl={program.youtubeUrl}
        alt={program.name}
        className="relative mx-auto mt-0 aspect-[21/9] max-w-6xl overflow-hidden bg-mist lg:rounded-b-lg"
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <article className="space-y-8 lg:col-span-2">
            <div>
              <h2 className="font-display text-2xl">Purpose</h2>
              <p className="mt-2 leading-relaxed text-muted">{program.purpose}</p>
            </div>
            {program.whoCanParticipate ? (
              <div>
                <h2 className="font-display text-2xl">Who can participate</h2>
                <p className="mt-2 leading-relaxed text-muted">{program.whoCanParticipate}</p>
              </div>
            ) : null}
            {program.curriculum.length ? (
              <div>
                <h2 className="font-display text-2xl">Curriculum</h2>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted">
                  {program.curriculum.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {program.process ? (
              <div>
                <h2 className="font-display text-2xl">Process</h2>
                <p className="mt-2 leading-relaxed text-muted">{program.process}</p>
              </div>
            ) : null}
            {program.outcomes ? (
              <div>
                <h2 className="font-display text-2xl">Outcomes</h2>
                <p className="mt-2 leading-relaxed text-muted">{program.outcomes}</p>
              </div>
            ) : null}
          </article>
          <aside className="rounded-lg border border-brand/10 bg-paper p-6">
            <p className="text-sm text-muted">This page is generated from the Program content type. Editors change it in the admin panel — not in code.</p>
          </aside>
        </div>
      </Section>
    </>
  );
}
