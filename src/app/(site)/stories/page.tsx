import Image from "next/image";
import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { Badge, Card } from "@/components/ui/card";
import { getPublishedStories, type StoryCategory } from "@/lib/content/stories";

const categories: { slug: StoryCategory | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "stories_of_change", label: "Stories of Change" },
  { slug: "news", label: "News" },
  { slug: "events", label: "Events" },
  { slug: "ambassador_stories", label: "Ambassador Stories" },
  { slug: "community_stories", label: "Community Stories" },
  { slug: "campaigns", label: "Campaigns" },
];

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stories & News",
  description: "Stories of change, news, campaigns, and community reporting from GLAI.",
};

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = categories.some((item) => item.slug === category)
    ? (category as StoryCategory)
    : undefined;
  const stories = await getPublishedStories(selected);

  return (
    <>
      <Section className="bg-mist">
        <Kicker>Editorial</Kicker>
        <h1 className="mt-3 font-display text-4xl">Stories & News</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Unpublished drafts never appear here. Categories are stored on each story in the CMS.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={item.slug === "all" ? "/stories" : `/stories?category=${item.slug}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                (item.slug === "all" && !selected) || item.slug === selected
                  ? "bg-brand text-paper"
                  : "bg-paper text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.slug}`}>
              <Card className="editorial-card transition hover:-translate-y-1">
                {story.featuredImageUrl ? (
                  <div className="relative aspect-[16/10]">
                    <Image src={story.featuredImageUrl} alt={story.title} fill className="object-cover" sizes="400px" />
                  </div>
                ) : null}
                <div className="p-5">
                  <Badge>{story.category.replaceAll("_", " ")}</Badge>
                  <h2 className="mt-3 font-display text-xl text-brand">{story.title}</h2>
                  <p className="mt-2 text-sm text-muted">{story.excerpt}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
