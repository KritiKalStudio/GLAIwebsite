import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MediaFrame } from "@/components/blocks/media-frame";
import { Kicker, Section } from "@/components/blocks/section";
import { JsonLd } from "@/components/json-ld";
import { getPublishedStory } from "@/lib/content/stories";
import { getSiteSettings } from "@/lib/content/settings";
import { getSiteUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { editorHtml, sanitizeRichText } from "@/lib/rich-text";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  return {
    title: story?.seoTitle ?? story?.title,
    description: story?.seoDescription ?? story?.excerpt,
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [story, settings] = await Promise.all([getPublishedStory(slug), getSiteSettings()]);
  if (!story) notFound();
  const url = `${getSiteUrl()}/stories/${story.slug}`;
  const orgName = settings?.orgName ?? "Global Love Ambassadors Initiative";

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: story.title,
          description: story.excerpt,
          url,
          imageUrl: story.featuredImageUrl,
          publishedAt: story.publishedAt,
          updatedAt: story.updatedAt,
          authorName: story.authorName,
          orgName,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: getSiteUrl() },
          { name: "Stories", url: `${getSiteUrl()}/stories` },
          { name: story.title, url },
        ])}
      />
      <Section className="bg-mist pb-8">
        <Kicker>{story.category.replaceAll("_", " ")}</Kicker>
        <h1 className="mt-3 max-w-3xl font-display text-2xl sm:text-4xl">{story.title}</h1>
        <p className="mt-4 text-sm text-muted">
          {story.authorName ? `${story.authorName} · ` : ""}
          {formatDate(story.publishedAt)}
        </p>
      </Section>
      {story.featuredImageUrl ? <MediaFrame
        src={story.featuredImageUrl}
        alt={story.title}
        className="relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden bg-mist lg:aspect-[21/9]"
      /> : null}
      <Section>
        <article className="rich-content mx-auto" dangerouslySetInnerHTML={{ __html: sanitizeRichText(editorHtml(story.body)) }} />
      </Section>
    </>
  );
}
