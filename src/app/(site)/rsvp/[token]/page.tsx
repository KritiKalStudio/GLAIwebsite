import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventView } from "@/components/events/event-view";
import { getEventByRsvpToken } from "@/lib/content/events";
import { getRequestSiteUrl } from "@/lib/env";
import { absoluteUrl, eventDisplayTitle, rsvpPath } from "@/lib/events/portal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const event = await getEventByRsvpToken(token);
  return {
    title: event ? eventDisplayTitle(event) : "Event RSVP",
    description: event?.description || "Confirm whether you plan to attend.",
    robots: { index: false, follow: false },
  };
}

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const event = await getEventByRsvpToken(token);
  if (!event) notFound();
  const origin = await getRequestSiteUrl();
  return <EventView event={event} url={absoluteUrl(origin, rsvpPath(token))} />;
}
