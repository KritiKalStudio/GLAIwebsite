import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";

export const CACHE_TAGS = {
  settings: "cms:settings",
  pages: "cms:pages",
  stories: "cms:stories",
  events: "cms:events",
  programs: "cms:programs",
  projects: "cms:projects",
  ambassadors: "cms:ambassadors",
  volunteers: "cms:volunteers",
  donations: "cms:donations",
  people: "cms:people",
  faqs: "cms:faqs",
  impact: "cms:impact",
  videos: "cms:videos",
} as const;

const DEFAULT_REVALIDATE_SECONDS = 120;

/** Request-level memo + cross-request Data Cache for public CMS reads. */
export function cached<TArgs extends unknown[], TResult>(
  key: string,
  tags: string[],
  fn: (...args: TArgs) => Promise<TResult>,
  revalidate = DEFAULT_REVALIDATE_SECONDS,
): (...args: TArgs) => Promise<TResult> {
  return cache((...args: TArgs) =>
    unstable_cache(
      async () => fn(...args),
      [key, ...args.map((value) => JSON.stringify(value ?? null))],
      { tags, revalidate },
    )(),
  );
}

export function revalidateContent(...tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }
}
