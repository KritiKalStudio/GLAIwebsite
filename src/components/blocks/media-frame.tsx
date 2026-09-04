import Image from "next/image";
import { youtubeIdFromUrl } from "@/lib/youtube";

export function MediaFrame({
  src,
  alt,
  className = "relative aspect-[16/10] overflow-hidden bg-mist",
  youtubeUrl,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  youtubeUrl?: string | null;
}) {
  const youtubeId = youtubeIdFromUrl(youtubeUrl ?? undefined);
  if (youtubeId) {
    return (
      <div className={className}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (!src) {
    return <div className={`${className} bg-mist`} aria-hidden />;
  }
  return (
    <div className={className}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 960px, 100vw" />
    </div>
  );
}
