import { PageHero, StatStrip } from "@/components/blocks/page-sections";
import { Section } from "@/components/blocks/section";
import { MediaCard } from "@/components/ui/card";
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
        <h2 className="font-display text-2xl sm:text-3xl">Impact Portfolio</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Each case study records a place, a challenge, and what was done. Beneficiary counts stay empty until they are
          verified.
        </p>
        <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <MediaCard key={project.id} href={`/impact/${project.slug}`} imageUrl={project.featuredImageUrl} imageAlt={project.title}>
              <p className="text-[10px] tracking-wide text-accent uppercase sm:text-xs">
                {project.location}, {project.country}
              </p>
              <h3 className="mt-1 font-display text-sm text-brand sm:mt-2 sm:text-xl">{project.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted sm:mt-2 sm:line-clamp-3 sm:text-sm">{project.challenge}</p>
            </MediaCard>
          ))}
        </div>
      </Section>
    </>
  );
}
