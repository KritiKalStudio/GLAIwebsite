import Image from "next/image";
import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { Card } from "@/components/ui/card";
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
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.slug}`}>
            <Card>
              {event.featuredImageUrl ? (
                <div className="relative aspect-[16/9]">
                  <Image src={event.featuredImageUrl} alt={event.title} fill className="object-cover" sizes="480px" />
                </div>
              ) : null}
              <div className="p-5">
                <p className="text-xs text-accent uppercase">{formatDate(event.startsAt)}</p>
                <h3 className="mt-2 font-display text-xl text-brand">{event.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {event.isOnline ? "Online" : [event.venueName, event.city, event.country].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Card>
          </Link>
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
        <h1 className="mt-3 font-display text-4xl">Events</h1>
      </Section>
      <Section className="space-y-16">
        <EventList title="Upcoming" events={upcoming} />
        <EventList title="Past" events={past} />
      </Section>
    </>
  );
}
