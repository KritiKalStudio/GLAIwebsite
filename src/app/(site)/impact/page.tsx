import Image from "next/image";
import Link from "next/link";
import { PageHero, StatStrip } from "@/components/blocks/page-sections";
import { Section } from "@/components/blocks/section";
import { Card } from "@/components/ui/card";
import { getPublishedProjects } from "@/lib/content/programs";
import { getPublicImpactStats } from "@/lib/content/settings";

export const metadata = {
  title: "Impact",
  description: "Case studies and verified figures — never invented for visual effect.",
};

export default async function ImpactPage() {
  const [projects, stats] = await Promise.all([getPublishedProjects(), getPublicImpactStats()]);

  return (
    <>
      <PageHero
        kicker="Impact Portfolio"
        headline="Work that can be named, located, and checked."
        subheadline="Every project records a challenge, the actions taken, and partners. Headline statistics stay at “Pending verification” until GLAI supplies a figure."
        primary={{ href: "/stories", label: "Read stories of change" }}
        secondary={{ href: "/transparency", label: "Transparency Center" }}
      />
      <StatStrip
        heading="Headline figures"
        note="Figures appear only when GLAI has verified them."
        stats={stats}
      />
      <Section>
        <h2 className="font-display text-3xl">Impact Portfolio</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Each case study records a place, a challenge, and what was done. Beneficiary counts stay empty until they are
          verified.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/impact/${project.slug}`}>
              <Card className="editorial-card transition hover:-translate-y-1">
                {project.featuredImageUrl ? (
                  <div className="relative aspect-[16/10]">
                    <Image src={project.featuredImageUrl} alt="" fill className="object-cover" sizes="400px" />
                  </div>
                ) : null}
                <div className="p-5">
                  <p className="text-xs tracking-wide text-accent uppercase">
                    {project.location}, {project.country}
                  </p>
                  <h3 className="mt-2 font-display text-xl text-brand">{project.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{project.challenge}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
