import { EventRegisterForm } from "@/components/forms/event-register-form";
import { MediaFrame } from "@/components/blocks/media-frame";
import { Kicker, Section } from "@/components/blocks/section";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { countEventRegistrations } from "@/lib/content/events";
import { getSiteSettings } from "@/lib/content/settings";
import type { events } from "@/db/schema";
import { getSiteUrl } from "@/lib/env";
import {
  eventDisplayTitle,
  eventHeaderImage,
  eventWhen,
  eventWhere,
  normalizeConfirmationRedirect,
  registrationIsOpen,
} from "@/lib/events/portal";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/structured-data";

type EventRow = typeof events.$inferSelect;

export async function EventView({ event, url }: { event: EventRow; url: string }) {
  const [counts, settings] = await Promise.all([countEventRegistrations(event.id), getSiteSettings()]);
  const title = eventDisplayTitle(event);
  const open = registrationIsOpen(event);
  const headerImage = eventHeaderImage(event);
  const orgName = settings?.orgName ?? "Global Love Ambassadors Initiative";
  const remaining = event.capacity == null ? null : Math.max(0, event.capacity - counts.registered);
  const place = eventWhere(event);

  return (
    <>
      {event.startsAt ? (
        <JsonLd
          data={eventJsonLd({
            title,
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
            imageUrl: headerImage,
            orgName,
          })}
        />
      ) : null}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: getSiteUrl() },
          { name: "Events", url: `${getSiteUrl()}/events` },
          { name: title, url },
        ])}
      />
      <Section className="bg-mist">
        <Kicker>Event</Kicker>
        <h1 className="mt-3 font-display text-2xl sm:text-4xl">{title}</h1>
        <p className="mt-3 text-muted">{eventWhen(event)}</p>
        <p className="text-sm text-muted">{place}</p>
        {event.startsAt ? (
          <ButtonLink href={`/events/${event.slug}/calendar.ics`} variant="outline" className="mt-6">
            Add to calendar
          </ButtonLink>
        ) : null}
      </Section>
      {headerImage || event.youtubeUrl ? (
        <MediaFrame
          src={headerImage}
          youtubeUrl={event.youtubeUrl}
          alt={title}
          className="relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden bg-mist lg:aspect-[21/9]"
        />
      ) : null}
      <Section>
        <div className="mx-auto grid w-full max-w-3xl gap-10">
          <article>
            {event.description ? <p className="whitespace-pre-line leading-relaxed text-muted">{event.description}</p> : null}
            {event.registrationType === "ticketed" && event.ticketPrice ? (
              <p className="mt-4 text-sm text-muted">
                Ticket: {event.ticketPrice} {event.ticketCurrency ?? ""}
              </p>
            ) : null}
            {(event.speakers ?? []).length ? (
              <>
                <h2 className="mt-10 font-display text-2xl">Speakers</h2>
                <ul className="mt-3 space-y-2">
                  {(event.speakers ?? []).map((speaker) => (
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
                <p className="mt-2 whitespace-pre-line text-muted">{event.postEventReport}</p>
              </>
            ) : null}
          </article>
          <aside>
            {open ? (
              <>
                <p className="mb-4 text-sm text-muted">
                  {event.capacity
                    ? remaining
                      ? `${remaining} of ${event.capacity} places remaining.`
                      : "This event is full. You can still say you want to attend and join the waitlist."
                    : "Tell us whether you plan to attend."}
                </p>
                <EventRegisterForm
                  eventId={event.id}
                  fields={(event.customFields ?? []).filter((field) => field.kind !== "choice" || field.options.length >= 2)}
                  redirectUrl={normalizeConfirmationRedirect(event.confirmationRedirectUrl)}
                />
              </>
            ) : (
              <p className="rounded-md bg-mist p-4 text-sm">Registration is closed.</p>
            )}
          </aside>
        </div>
      </Section>
    </>
  );
}
