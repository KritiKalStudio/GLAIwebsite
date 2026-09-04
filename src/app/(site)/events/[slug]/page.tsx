import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventRegisterForm } from "@/components/forms/event-register-form";
import { MediaFrame } from "@/components/blocks/media-frame";
import { Kicker, Section } from "@/components/blocks/section";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { countEventRegistrations, getPublishedEvent } from "@/lib/content/events";
import { getSiteSettings } from "@/lib/content/settings";
import { getSiteUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  return { title: event?.title, description: event?.description };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, settings] = await Promise.all([getPublishedEvent(slug), getSiteSettings()]);
  if (!event) notFound();
  const counts = await countEventRegistrations(event.id);
  const url = `${getSiteUrl()}/events/${event.slug}`;
  const orgName = settings?.orgName ?? "Global Love Ambassadors Initiative";
  const remaining =
    event.capacity == null ? null : Math.max(0, event.capacity - counts.registered);

  return (
    <>
      <JsonLd
        data={eventJsonLd({
          title: event.title,
          description: event.description,
          url,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          isOnline: event.isOnline,
          onlineUrl: event.onlineUrl,
          venueName: event.venueName,
          address: event.address,
          city: event.city,
          country: event.country,
          imageUrl: event.featuredImageUrl,
          orgName,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: getSiteUrl() },
          { name: "Events", url: `${getSiteUrl()}/events` },
          { name: event.title, url },
        ])}
      />
      <Section className="bg-mist">
        <Kicker>Event</Kicker>
        <h1 className="mt-3 font-display text-4xl">{event.title}</h1>
        <p className="mt-3 text-muted">
          {formatDate(event.startsAt, "d MMMM yyyy, HH:mm")} {event.timezone}
        </p>
        <p className="text-sm text-muted">
          {event.isOnline
            ? "Online gathering"
            : [event.venueName, event.address, event.city, event.country].filter(Boolean).join(" · ")}
        </p>
        <ButtonLink href={`/events/${event.slug}/calendar.ics`} variant="outline" className="mt-6">
          Add to calendar
        </ButtonLink>
      </Section>
      <MediaFrame
        src={event.featuredImageUrl}
        youtubeUrl={event.youtubeUrl}
        alt={event.title}
        className="relative mx-auto aspect-[21/9] max-w-6xl overflow-hidden bg-mist"
      />
      <Section className="grid gap-10 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <p className="leading-relaxed text-muted">{event.description}</p>
          {event.speakers.length ? (
            <>
              <h2 className="mt-10 font-display text-2xl">Speakers</h2>
              <ul className="mt-3 space-y-2">
                {event.speakers.map((speaker) => (
                  <li key={speaker.name}>
                    <strong>{speaker.name}</strong>
                    {speaker.title ? ` — ${speaker.title}` : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {event.postEventReport ? (
            <>
              <h2 className="mt-10 font-display text-2xl">Post-event report</h2>
              <p className="mt-2 text-muted">{event.postEventReport}</p>
            </>
          ) : null}
        </article>
        <aside>
          {event.registrationType === "closed" ? (
            <p className="rounded-md bg-mist p-4 text-sm">Registration is closed.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {event.capacity
                  ? remaining
                    ? `${remaining} of ${event.capacity} places remaining.`
                    : "This event is full. You can join the waitlist."
                  : "Registration is open."}
              </p>
              <EventRegisterForm eventId={event.id} />
            </>
          )}
        </aside>
      </Section>
    </>
  );
}
