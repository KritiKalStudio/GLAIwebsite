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
        "overflow-hidden rounded-lg border border-brand/10 bg-paper shadow-[0_12px_34px_rgba(16,42,67,0.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(16,42,67,0.12)]",
        className,
      )}
    >
      {children}
    </div>
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
