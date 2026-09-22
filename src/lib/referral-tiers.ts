/**
 * Honour thresholds. Each step asks for more new members than the one before:
 * 1, 5, 15, 40, 100, 250, 600, 1,500.
 */
export const REFERRAL_TIERS = [
  {
    slug: "starter",
    name: "Starter",
    threshold: 1,
    tagline: "The first person who joined with your code.",
    stops: ["#F6D2B5", "#C56A34", "#7A3B1C"] as const,
    ink: "#4A2412",
  },
  {
    slug: "explorer",
    name: "Explorer",
    threshold: 5,
    tagline: "A small circle, already growing.",
    stops: ["#D7F4F0", "#3AA89A", "#0E5C54"] as const,
    ink: "#08352F",
  },
  {
    slug: "achiever",
    name: "Achiever",
    threshold: 15,
    tagline: "Steady invitations, a stronger network.",
    stops: ["#E7F3D4", "#6B9A3A", "#2F4A18"] as const,
    ink: "#1C3010",
  },
  {
    slug: "leader",
    name: "Leader",
    threshold: 40,
    tagline: "A name other people are passing on.",
    stops: ["#D6E4F5", "#3D6AAD", "#061D4B"] as const,
    ink: "#061D4B",
  },
  {
    slug: "elite",
    name: "Elite",
    threshold: 100,
    tagline: "One hundred members joined through you.",
    stops: ["#FFF3C4", "#E0B03A", "#8C6410"] as const,
    ink: "#4A3208",
  },
  {
    slug: "royal",
    name: "Royal",
    threshold: 250,
    tagline: "A few hundred people, one code at a time.",
    stops: ["#F3E4F8", "#A45BC4", "#4C1D6B"] as const,
    ink: "#3A1452",
  },
  {
    slug: "imperial",
    name: "Imperial",
    threshold: 600,
    tagline: "Hundreds of members, still climbing.",
    stops: ["#F8E0E4", "#A33B52", "#4A1524"] as const,
    ink: "#3A1018",
  },
  {
    slug: "legend",
    name: "Legend",
    threshold: 1500,
    tagline: "One thousand five hundred. The highest badge.",
    stops: ["#FFF8E8", "#F0D48A", "#C88A13"] as const,
    ink: "#4A3208",
  },
] as const;

export type ReferralTier = (typeof REFERRAL_TIERS)[number];
export type ReferralTierSlug = ReferralTier["slug"];

const CODE_BODY = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export function tierForCount(count: number): ReferralTier | null {
  let earned: ReferralTier | null = null;
  for (const tier of REFERRAL_TIERS) {
    if (count >= tier.threshold) earned = tier;
  }
  return earned;
}

export function nextTierForCount(count: number): ReferralTier | null {
  return REFERRAL_TIERS.find((tier) => count < tier.threshold) ?? null;
}

export function tierBySlug(slug: string | null | undefined): ReferralTier | null {
  if (!slug) return null;
  return REFERRAL_TIERS.find((tier) => tier.slug === slug) ?? null;
}

export function referralProgress(count: number) {
  const tier = tierForCount(count);
  const next = nextTierForCount(count);
  if (!next) {
    return {
      tier,
      next: null,
      ratio: 1,
      remaining: 0,
      label: `${tier?.name ?? "Legend"} is the highest badge. ${count.toLocaleString()} members have joined with your code.`,
    };
  }
  const floor = tier?.threshold ?? 0;
  const ratio = Math.min(1, Math.max(0, (count - floor) / (next.threshold - floor)));
  const remaining = next.threshold - count;
  const people = remaining === 1 ? "person" : "people";
  const label = tier
    ? `${remaining.toLocaleString()} more ${people} to unlock ${next.name}.`
    : `Refer ${remaining.toLocaleString()} ${people} to unlock ${next.name}.`;
  return { tier, next, ratio, remaining, label };
}

/** Accepts GLAI-XXXXXX, the six-character body, or a signup link that contains the code. */
export function normalizeReferralCode(input: string): string | null {
  const upper = input.toUpperCase();
  const prefixed = upper.match(/GLAI[\s-]*([ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6})/);
  if (prefixed) return `GLAI-${prefixed[1]}`;
  const bare = upper.replace(/[^A-Z0-9]/g, "");
  if (CODE_BODY.test(bare)) return `GLAI-${bare}`;
  return null;
}

export function referralSignupPath(code: string) {
  return `/signup?ref=${encodeURIComponent(code)}`;
}
