import Image from "next/image";
import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { YoutubeEpisodeCard } from "@/components/blocks/youtube-episode-card";
import { Badge, Card } from "@/components/ui/card";
import { getPublishedEvents } from "@/lib/content/events";
import { getPublishedStories, type StoryCategory } from "@/lib/content/stories";
import { getPublishedVideos } from "@/lib/content/videos";
import { formatDate } from "@/lib/format";

const categories: { slug: StoryCategory | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "stories_of_change", label: "Stories of Change" },
  { slug: "news", label: "News" },
  { slug: "events", label: "Events" },
  { slug: "ambassador_stories", label: "Ambassador Stories" },
  { slug: "community_stories", label: "Community Stories" },
  { slug: "campaigns", label: "Campaigns" },
];


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
  const showEvents = !selected || selected === "events";
  const [stories, newsVideos, publishedEvents] = await Promise.all([
    getPublishedStories(selected),
    getPublishedVideos("news"),
    showEvents ? getPublishedEvents() : Promise.resolve([]),
  ]);

  return (
    <>
      <Section className="bg-mist">
        <Kicker>Editorial</Kicker>
        <h1 className="mt-3 font-display text-4xl">Stories & News</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Written reporting lives here. Films from the GLAI news channel appear below as they are published. Unpublished
          drafts never appear.
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
      {newsVideos.length ? (
        <Section>
          <h2 className="font-display text-3xl">From the news channel</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Watch on this page or open the same film on YouTube.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {newsVideos.map((episode) => (
              <YoutubeEpisodeCard
                key={episode.id}
                youtubeId={episode.youtubeId}
                title={episode.title}
                description={episode.description}
                thumbnailUrl={episode.thumbnailUrl}
              />
            ))}
          </div>
        </Section>
      ) : null}
      {publishedEvents.length && showEvents ? (
        <Section>
          <h2 className="font-display text-3xl">Events</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Gatherings published from the Events console.</p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <Card className="editorial-card transition hover:-translate-y-1">
                  {event.featuredImageUrl ? (
                    <div className="relative aspect-[16/10]">
                      <Image src={event.featuredImageUrl} alt={event.title} fill className="object-cover" sizes="400px" />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <Badge>events</Badge>
                    <p className="mt-2 text-xs text-accent uppercase">{formatDate(event.startsAt)}</p>
                    <h2 className="mt-2 font-display text-xl text-brand">{event.title}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {event.isOnline ? "Online" : [event.venueName, event.city, event.country].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
      <Section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
