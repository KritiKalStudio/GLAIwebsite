import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { EventView } from "@/components/events/event-view";
import { getPublishedEvent } from "@/lib/content/events";
import { getSiteUrl } from "@/lib/env";
import { eventDisplayTitle, isPublicSlug } from "@/lib/events/portal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  return {
    title: event ? eventDisplayTitle(event) : "Event",
    description: event?.description || undefined,
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) notFound();
  if (isPublicSlug(event.slug) && event.slug !== slug) redirect(`/events/${event.slug}`);
  return <EventView event={event} url={`${getSiteUrl()}/events/${event.slug}`} />;
}
