import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-brand/10 bg-paper shadow-none transition duration-300 md:rounded-lg md:shadow-[0_12px_34px_rgba(16,42,67,0.055)] md:hover:-translate-y-1 md:hover:shadow-[0_20px_44px_rgba(16,42,67,0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MediaCard({
  href,
  imageUrl,
  imageAlt = "",
  children,
  className,
}: {
  href?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const body = (
    <article className={cn("media-card", className)}>
      {imageUrl ? (
        <div className="media-card-image">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 767px) 96px, 400px"
          />
        </div>
      ) : null}
      <div className="media-card-body">{children}</div>
    </article>
  );
  if (!href) return body;
  return (
    <Link href={href} className="media-card-link">
      {body}
    </Link>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "accent" | "hope" | "sunshine" | "muted";
}) {
  const tones = {
    brand: "bg-brand/10 text-brand",
    accent: "bg-accent/10 text-accent",
    hope: "bg-hope/15 text-ink",
    sunshine: "bg-sunshine/30 text-ink",
    muted: "bg-mist text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center self-start rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
