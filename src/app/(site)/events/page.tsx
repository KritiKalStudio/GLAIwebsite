import { Kicker, Section } from "@/components/blocks/section";
import { MediaCard } from "@/components/ui/card";
import { getPastEvents, getUndatedEvents, getUpcomingEvents } from "@/lib/content/events";
import { eventCardImage, eventDisplayTitle, eventWhere } from "@/lib/events/portal";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Events",
  description: "Upcoming and past GLAI gatherings, dialogues, and Global Love Day hosts.",
};

function EventList({
  title,
  events,
  undated = false,
}: {
  title: string;
  events: Awaited<ReturnType<typeof getUpcomingEvents>>;
  undated?: boolean;
}) {
  if (!events.length) return null;
  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl">{title}</h2>
      <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-6 md:grid-cols-2">
        {events.map((event) => {
          const name = eventDisplayTitle(event);
          return (
            <MediaCard
              key={event.id}
              href={`/events/${event.slug}`}
              imageUrl={eventCardImage(event)}
              imageAlt={name}
            >
              <p className="text-[10px] text-accent uppercase sm:text-xs">
                {undated ? "Date to be announced" : formatDate(event.startsAt)}
              </p>
              <h3 className="mt-0.5 font-display text-sm text-brand sm:mt-2 sm:text-xl">{name}</h3>
              <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">{eventWhere(event)}</p>
            </MediaCard>
          );
        })}
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const [upcoming, undated, past] = await Promise.all([
    getUpcomingEvents(),
    getUndatedEvents(),
    getPastEvents(),
  ]);
  const empty = !upcoming.length && !undated.length && !past.length;
  return (
    <>
      <Section className="bg-brand text-paper">
        <Kicker>Gatherings</Kicker>
        <h1 className="mt-3 font-display text-2xl sm:text-4xl">Events</h1>
      </Section>
      <Section className="space-y-5 sm:space-y-16">
        {empty ? <p className="text-muted">No events are published yet.</p> : null}
        <EventList title="Upcoming" events={upcoming} />
        <EventList title="Date to be announced" events={undated} undated />
        <EventList title="Past" events={past} />
      </Section>
    </>
  );
}
