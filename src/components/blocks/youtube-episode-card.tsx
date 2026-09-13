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
    <article className="editorial-card overflow-hidden bg-paper">
      <div className="relative aspect-video bg-mist">
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
            <Image src={poster} alt="" fill className="object-cover" sizes="(min-width: 1024px) 560px, 100vw" />
            <span className="absolute inset-0 bg-brand/25 transition group-hover:bg-brand/15" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-sunshine text-ink shadow-lg transition group-hover:scale-105">
                <span className="ml-0.5 text-lg" aria-hidden>
                  ▶
                </span>
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="space-y-3 p-5">
        <h2 className="font-display text-xl text-brand">{title}</h2>
        {description ? <p className="text-sm leading-relaxed text-muted">{description}</p> : null}
        <ButtonLink href={watchUrl} variant="outline" size="sm">
          Open in YouTube
        </ButtonLink>
      </div>
    </article>
  );
}
