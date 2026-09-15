import { PageHero } from "@/components/blocks/page-sections";
import { YoutubeEpisodeCard } from "@/components/blocks/youtube-episode-card";
import { Section } from "@/components/blocks/section";
import { getPublishedVideos } from "@/lib/content/videos";

export const metadata = {
  title: "Podcast",
  description: "Watch GLAI podcast episodes on this site or open them on YouTube.",
};

export default async function PodcastPage() {
  const episodes = await getPublishedVideos("podcast");

  return (
    <>
      <PageHero
        kicker="Podcast"
        headline="Listen in public."
        subheadline="Episodes from the GLAI podcast channel. Watch here, or open the same film on YouTube."
      />
      <Section>
        {episodes.length ? (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {episodes.map((episode) => (
              <YoutubeEpisodeCard
                key={episode.id}
                youtubeId={episode.youtubeId}
                title={episode.title}
                description={episode.description}
                thumbnailUrl={episode.thumbnailUrl}
              />
            ))}
          </div>
        ) : (
          <p className="max-w-2xl text-muted">
            Episodes will appear here as they are published from the YouTube podcast channel. Nothing is shown until an
            editor adds a video in the admin portal.
          </p>
        )}
      </Section>
    </>
  );
}
