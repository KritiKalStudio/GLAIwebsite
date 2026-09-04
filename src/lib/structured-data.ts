import { getSiteUrl } from "@/lib/env";
import type { getSiteSettings } from "@/lib/content/settings";

type Settings = NonNullable<Awaited<ReturnType<typeof getSiteSettings>>>;

export function organizationJsonLd(settings: Settings | null) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: settings?.orgName ?? "Global Love Ambassadors Initiative",
    alternateName: "GLAI",
    description: settings?.tagline,
    url,
    email: settings?.contact.email,
    telephone: settings?.contact.phone,
    address: settings?.contact.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.contact.address,
        }
      : undefined,
    sameAs: (settings?.social ?? []).map((item) => item.href).filter(Boolean),
  };
}

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  authorName?: string | null;
  orgName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.imageUrl ?? undefined,
    datePublished: input.publishedAt?.toISOString(),
    dateModified: input.updatedAt?.toISOString(),
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@type": "Organization", name: input.orgName },
    publisher: {
      "@type": "NGO",
      name: input.orgName,
    },
  };
}

export function eventJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  startsAt: Date;
  endsAt?: Date | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  venueName?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  imageUrl?: string | null;
  orgName: string;
}) {
  const location = input.isOnline
    ? {
        "@type": "VirtualLocation",
        url: input.onlineUrl ?? input.url,
      }
    : {
        "@type": "Place",
        name: input.venueName ?? input.city ?? "GLAI event",
        address: {
          "@type": "PostalAddress",
          streetAddress: input.address ?? undefined,
          addressLocality: input.city ?? undefined,
          addressCountry: input.country ?? undefined,
        },
      };

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.title,
    description: input.description,
    url: input.url,
    image: input.imageUrl ?? undefined,
    startDate: input.startsAt.toISOString(),
    endDate: input.endsAt?.toISOString(),
    eventAttendanceMode: input.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location,
    organizer: {
      "@type": "NGO",
      name: input.orgName,
      url: getSiteUrl(),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
