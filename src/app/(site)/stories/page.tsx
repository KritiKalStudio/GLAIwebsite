import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { YoutubeEpisodeCard } from "@/components/blocks/youtube-episode-card";
import { Badge, MediaCard } from "@/components/ui/card";
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
        <h1 className="mt-3 font-display text-2xl sm:text-4xl">Stories & News</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
          Written reporting lives here. Films from the GLAI news channel appear below as they are published. Unpublished
          drafts never appear.
        </p>
        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:px-0">
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={item.slug === "all" ? "/stories" : `/stories?category=${item.slug}`}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:border-brand sm:px-3 sm:py-1.5 sm:text-sm ${
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
          <h2 className="font-display text-2xl sm:text-3xl">From the news channel</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Watch on this page or open the same film on YouTube.
          </p>
          <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
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
          <h2 className="font-display text-2xl sm:text-3xl">Events</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Gatherings published from the Events console.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedEvents.map((event) => (
              <MediaCard key={event.id} href={`/events/${event.slug}`} imageUrl={event.featuredImageUrl} imageAlt={event.title}>
                <Badge>events</Badge>
                <p className="mt-1 text-[10px] text-accent uppercase sm:mt-2 sm:text-xs">{formatDate(event.startsAt)}</p>
                <h2 className="mt-1 font-display text-sm text-brand sm:mt-2 sm:text-xl">{event.title}</h2>
                <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">
                  {event.isOnline ? "Online" : [event.venueName, event.city, event.country].filter(Boolean).join(" · ")}
                </p>
              </MediaCard>
            ))}
          </div>
        </Section>
      ) : null}
      <Section>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {stories.map((story) => (
            <MediaCard key={story.id} href={`/stories/${story.slug}`} imageUrl={story.featuredImageUrl} imageAlt={story.title}>
              <Badge>{story.category.replaceAll("_", " ")}</Badge>
              <h2 className="mt-1.5 font-display text-sm text-brand sm:mt-3 sm:text-xl">{story.title}</h2>
              <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">{story.excerpt}</p>
            </MediaCard>
          ))}
        </div>
      </Section>
    </>
  );
}
