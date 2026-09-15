import { Kicker, Section } from "@/components/blocks/section";
import { MediaCard } from "@/components/ui/card";
import { getPastEvents, getUpcomingEvents } from "@/lib/content/events";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Events",
  description: "Upcoming and past GLAI gatherings, dialogues, and Global Love Day hosts.",
};

function EventList({
  title,
  events,
}: {
  title: string;
  events: Awaited<ReturnType<typeof getUpcomingEvents>>;
}) {
  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl">{title}</h2>
      <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-6 md:grid-cols-2">
        {events.map((event) => (
          <MediaCard key={event.id} href={`/events/${event.slug}`} imageUrl={event.featuredImageUrl} imageAlt={event.title}>
            <p className="text-[10px] text-accent uppercase sm:text-xs">{formatDate(event.startsAt)}</p>
            <h3 className="mt-0.5 font-display text-sm text-brand sm:mt-2 sm:text-xl">{event.title}</h3>
            <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">
              {event.isOnline ? "Online" : [event.venueName, event.city, event.country].filter(Boolean).join(" · ")}
            </p>
          </MediaCard>
        ))}
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);
  return (
    <>
      <Section className="bg-brand text-paper">
        <Kicker>Gatherings</Kicker>
        <h1 className="mt-3 font-display text-2xl sm:text-4xl">Events</h1>
      </Section>
      <Section className="space-y-5 sm:space-y-16">
        <EventList title="Upcoming" events={upcoming} />
        <EventList title="Past" events={past} />
      </Section>
    </>
  );
}
