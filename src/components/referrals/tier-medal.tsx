"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import type { ReferralTier, ReferralTierSlug } from "@/lib/referral-tiers";

function HonourMark({ slug, ink }: { slug: ReferralTierSlug; ink: string }) {
  if (slug === "starter") {
    return <circle cx="40" cy="40" r="8" fill={ink} />;
  }
  if (slug === "explorer") {
    return (
      <g fill={ink}>
        <polygon points="40,20 47,40 40,35.5 33,40" />
        <polygon points="40,60 33,40 40,44.5 47,40" opacity="0.4" />
        <circle cx="40" cy="40" r="3.2" />
      </g>
    );
  }
  if (slug === "achiever") {
    return (
      <path
        d="M24 42.5 35 53.5 57 28"
        fill="none"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (slug === "leader") {
    return (
      <g fill={ink}>
        <rect x="26" y="22" width="4.2" height="38" rx="1" />
        <path d="M30.2 24h26l-7 9 7 9h-26z" />
      </g>
    );
  }
  if (slug === "elite") {
    return (
      <polygon
        fill={ink}
        points="40,20 45.2,33.2 59.4,34.4 48.6,43.6 51.8,57.6 40,50.2 28.2,57.6 31.4,43.6 20.6,34.4 34.8,33.2"
      />
    );
  }
  if (slug === "royal") {
    return (
      <g fill={ink}>
        <path d="M20 50 26 30l10 12L40 24l4 18 10-12 6 20z" />
        <rect x="20" y="50" width="40" height="6" rx="1.2" />
      </g>
    );
  }
  if (slug === "imperial") {
    return (
      <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round">
        <path d="M22 52c1.5-16 8-24 18-24s16.5 8 18 24" />
        <path d="M28 50c1.2-10 5.5-16 12-16s10.8 6 12 16" />
        <circle cx="40" cy="26" r="3" fill={ink} stroke="none" />
      </g>
    );
  }
  return (
    <g fill={ink}>
      <circle cx="40" cy="40" r="5.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <rect key={angle} x="38.3" y="18" width="3.4" height="12" rx="1.2" transform={`rotate(${angle} 40 40)`} />
      ))}
    </g>
  );
}

export function TierMedal({
  tier,
  state,
  size = "md",
}: {
  tier: ReferralTier;
  state: "locked" | "earned" | "current";
  size?: "sm" | "md";
}) {
  const paint = `${tier.slug}-${useId().replace(/:/g, "")}`;
  const px = size === "sm" ? 36 : 84;
  const locked = state === "locked";
  const label =
    state === "current"
      ? `${tier.name}, your current badge, unlocked at ${tier.threshold.toLocaleString()} referrals`
      : state === "earned"
        ? `${tier.name} unlocked at ${tier.threshold.toLocaleString()} referrals`
        : `${tier.name}, locked until ${tier.threshold.toLocaleString()} referrals`;

  const medal = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 80 80"
      role="img"
      aria-label={label}
      className={cn(locked && "opacity-50 grayscale", state === "current" && "drop-shadow-[0_8px_12px_rgba(200,138,19,0.35)]")}
    >
      <defs>
        <linearGradient id={`${paint}-seal`} x1="16" y1="8" x2="68" y2="74">
          <stop offset="0%" stopColor={tier.stops[0]} />
          <stop offset="46%" stopColor={tier.stops[1]} />
          <stop offset="100%" stopColor={tier.stops[2]} />
        </linearGradient>
        <radialGradient id={`${paint}-shine`} cx="32%" cy="28%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="36" fill={`url(#${paint}-seal)`} />
      <circle cx="40" cy="40" r="30.5" fill="none" stroke={tier.ink} strokeOpacity="0.28" strokeWidth="1.4" />
      <circle cx="40" cy="40" r="36" fill={`url(#${paint}-shine)`} />
      <HonourMark slug={tier.slug} ink={tier.ink} />
      {state === "current" ? <circle cx="40" cy="40" r="36.5" fill="none" stroke="#c88a13" strokeWidth="2.6" /> : null}
    </svg>
  );

  if (size === "sm") return medal;

  return (
    <figure className="flex w-28 flex-col items-center text-center">
      {medal}
      <figcaption className="mt-2">
        <span className="block font-display text-base text-ink">{tier.name}</span>
        <span className="mt-0.5 block text-[11px] leading-tight text-muted">
          {tier.threshold.toLocaleString()} {tier.threshold === 1 ? "person" : "people"}
        </span>
        <span className="mt-1 block text-[10px] font-semibold tracking-wide text-accent uppercase">
          {state === "current" ? "Your badge" : state === "earned" ? "Unlocked" : "Locked"}
        </span>
      </figcaption>
    </figure>
  );
}
