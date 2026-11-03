import Image from "next/image";
import { canOptimizeImage, normalizeMediaUrl } from "@/lib/media-url";

/** Renders a CMS image. Hosts outside the optimizer allow-list use a plain img so the page still loads. */
export function ContentImage({
  src,
  alt,
  sizes,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const normalized = normalizeMediaUrl(src);
  if (!normalized) return null;
  if (!canOptimizeImage(normalized, process.env.NEXT_PUBLIC_MEDIA_BASE_URL)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={normalized} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
    );
  }
  return <Image src={normalized} alt={alt} fill className={className} sizes={sizes} />;
}
