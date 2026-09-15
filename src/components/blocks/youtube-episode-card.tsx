"use client";

import { useState } from "react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { youtubeThumbnailUrl, youtubeWatchUrl } from "@/lib/youtube";

export function YoutubeEpisodeCard({
  youtubeId,
  title,
  description,
  thumbnailUrl,
}: {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const poster = thumbnailUrl || youtubeThumbnailUrl(youtubeId);
  const watchUrl = youtubeWatchUrl(youtubeId);

  return (
    <article className={playing ? "youtube-card youtube-card-playing" : "youtube-card"}>
      <div className="youtube-card-media">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="group absolute inset-0"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
          >
            <Image src={poster} alt="" fill className="object-cover" sizes="(max-width: 767px) 120px, (min-width: 1024px) 560px, 100vw" />
            <span className="absolute inset-0 bg-brand/25 transition group-hover:bg-brand/15" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sunshine text-ink shadow-lg transition group-hover:scale-105 sm:h-14 sm:w-14">
                <span className="ml-0.5 text-sm sm:text-lg" aria-hidden>
                  ▶
                </span>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="youtube-card-body">
        <h2 className="font-display text-sm leading-snug text-brand sm:text-xl">{title}</h2>
        {description ? <p className="line-clamp-2 text-xs leading-snug text-muted sm:line-clamp-none sm:text-sm">{description}</p> : null}
        <ButtonLink href={watchUrl} variant="outline" size="sm">
          Open in YouTube
        </ButtonLink>
      </div>
    </article>
  );
}
