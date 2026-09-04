import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MediaFrame } from "@/components/blocks/media-frame";
import { Kicker, Section } from "@/components/blocks/section";
import { Badge } from "@/components/ui/card";
import { JsonLd } from "@/components/json-ld";
import { getPublishedProject } from "@/lib/content/programs";
import { getSiteSettings } from "@/lib/content/settings";
import { getSiteUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  return { title: project?.title ?? "Project", description: project?.challenge };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getPublishedProject(slug), getSiteSettings()]);
  if (!project) notFound();
  const url = `${getSiteUrl()}/impact/${project.slug}`;
  const orgName = settings?.orgName ?? "Global Love Ambassadors Initiative";

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: project.title,
          description: project.challenge,
          url,
          imageUrl: project.featuredImageUrl,
          publishedAt: project.occurredOn,
          updatedAt: project.lastUpdated,
          orgName,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: getSiteUrl() },
          { name: "Impact", url: `${getSiteUrl()}/impact` },
          { name: project.title, url },
        ])}
      />
      <Section className="bg-mist">
        <Kicker>Impact Portfolio</Kicker>
        <h1 className="mt-3 font-display text-4xl">{project.title}</h1>
        <p className="mt-3 text-muted">
          {project.location}, {project.country}
          {project.occurredOn ? ` · ${formatDate(project.occurredOn)}` : ""}
        </p>
        <Badge tone="accent">{project.focusArea.replaceAll("_", " ")}</Badge>
      </Section>
      <MediaFrame
        src={project.featuredImageUrl}
        youtubeUrl={project.youtubeUrl}
        alt={project.title}
        className="relative mx-auto aspect-[21/9] max-w-6xl overflow-hidden bg-mist"
      />
      <Section className="grid gap-10 lg:grid-cols-3">
        <article className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="font-display text-2xl">The challenge</h2>
            <p className="mt-2 leading-relaxed text-muted">{project.challenge}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl">Actions taken</h2>
            <p className="mt-2 leading-relaxed text-muted">{project.actionsTaken}</p>
          </div>
        </article>
        <aside className="space-y-4 rounded-lg border border-brand/10 bg-paper p-6 text-sm">
          <p>
            <strong>Partners:</strong> {project.partners.join(", ") || "—"}
          </p>
          <p>
            <strong>Sponsors:</strong> {project.sponsors.join(", ") || "—"}
          </p>
          <p>
            <strong>People reached:</strong>{" "}
            {project.peopleReached ?? "Pending verification"}
          </p>
          <p className="text-muted">Last updated {formatDate(project.lastUpdated)}</p>
        </aside>
      </Section>
    </>
  );
}
