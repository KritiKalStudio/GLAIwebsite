import type { NavItem } from "@/db/schema/settings";

const LEGACY_APPLY_PATH = "/love-ambassadors/apply";

export function rewriteLegacyApplyHref(href: string) {
  if (
    href === LEGACY_APPLY_PATH ||
    href.startsWith(`${LEGACY_APPLY_PATH}?`) ||
    href.startsWith(`${LEGACY_APPLY_PATH}#`)
  ) {
    return `/signup${href.slice(LEGACY_APPLY_PATH.length)}`;
  }
  return href;
}

export function rewriteNavHrefs(items: NavItem[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    href: rewriteLegacyApplyHref(item.href),
    children: item.children ? rewriteNavHrefs(item.children) : undefined,
  }));
}

const REQUIRED: NavItem[] = [
  { label: "Stories & News", href: "/stories" },
  { label: "Podcast", href: "/podcast" },
];

const PRIMARY_ORDER = ["/", "/about", "/our-work", "/stories", "/podcast"];
const EXPLORE_ORDER = ["/impact", "/love-ambassadors", "/get-involved", "/resources"];

function pick(items: NavItem[], hrefs: string[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  return hrefs.map((href) => byHref.get(href)).filter((item): item is NavItem => Boolean(item));
}

export function splitSiteNav(nav: NavItem[]) {
  const have = new Set(nav.map((item) => item.href));
  const siteNav = [...nav, ...REQUIRED.filter((item) => !have.has(item.href))];
  const used = new Set([...PRIMARY_ORDER, ...EXPLORE_ORDER]);
  return {
    siteNav,
    primaryNav: pick(siteNav, PRIMARY_ORDER),
    exploreNav: [...pick(siteNav, EXPLORE_ORDER), ...siteNav.filter((item) => !used.has(item.href))],
  };
}
