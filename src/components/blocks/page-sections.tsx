import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, MediaCard } from "@/components/ui/card";
import { Kicker, Section } from "@/components/blocks/section";
import { editorHtml, sanitizeRichText } from "@/lib/rich-text";

type HeroAction = {
  href: string;
  label: string;
};

export function PageHero({
  kicker,
  headline,
  subheadline,
  primary,
  secondary,
  imageUrl,
}: {
  kicker?: string;
  headline: string;
  subheadline?: string;
  primary?: HeroAction;
  secondary?: HeroAction;
  imageUrl?: string;
}) {
  return (
    <section className="page-hero-grid relative isolate overflow-hidden bg-brand text-paper">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          className="object-cover opacity-45 transition duration-1000 hover:scale-[1.025]"
          sizes="100vw"
        />
      ) : null}
      <div className="absolute inset-0 bg-linear-to-r from-brand via-brand/94 to-brand/45" />
      <div aria-hidden="true" className="absolute -bottom-20 right-[8%] hidden h-72 w-72 rounded-full border border-paper/20 md:block" />
      <div aria-hidden="true" className="absolute -bottom-10 right-[12%] hidden h-52 w-52 rounded-full border border-paper/15 md:block" />
      <div className="relative mx-auto flex max-w-7xl items-center px-4 py-10 sm:py-16 lg:min-h-[570px] lg:px-8 lg:py-24">
        <div className="reveal">
          {kicker ? <p className="eyebrow text-sunshine">{kicker}</p> : null}
          <div className="mb-3 h-px w-10 bg-sunshine md:mb-6 md:w-14" />
          <h1 className="max-w-4xl font-display text-[1.85rem] leading-[1.12] text-balance sm:text-5xl lg:text-7xl">
            {headline}
          </h1>
          {subheadline ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/88 sm:mt-7 sm:text-lg lg:text-xl">{subheadline}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-10 sm:gap-3">
            {primary ? (
              <ButtonLink href={primary.href} variant="sunshine" size="lg">
                {primary.label}
              </ButtonLink>
            ) : null}
            {secondary ? (
              <ButtonLink
                href={secondary.href}
                variant="outline"
                size="lg"
                className="border-paper/40 bg-transparent text-paper hover:bg-paper/10"
              >
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProblemSection({
  heading,
  intro,
  items,
}: {
  heading: string;
  intro?: string;
  items: { title: string; body: string }[];
}) {
  return (
    <Section className="surface-grid bg-canvas">
      <Kicker>The problem</Kicker>
      <h2 className="editorial-rule mt-3 max-w-3xl font-display text-2xl text-balance sm:text-4xl lg:text-5xl">{heading}</h2>
      {intro ? <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-lg">{intro}</p> : null}
      <ul className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="rounded-md border border-brand/10 bg-paper p-3 sm:rounded-xl sm:p-6 sm:transition sm:hover:-translate-y-1">
            <h3 className="font-display text-sm text-brand sm:text-xl">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function StatStrip({
  heading,
  note,
  stats,
}: {
  heading?: string;
  note?: string;
  stats: { key: string; label: string; valueDisplay: string }[];
}) {
  return (
    <Section className="bg-brand text-paper">
      {heading ? <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2> : null}
      {note ? <p className="mt-2 max-w-2xl text-xs text-paper/70 sm:mt-3 sm:text-sm">{note}</p> : null}
      <dl className="mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.key} className="rounded-md border border-paper/15 bg-paper/8 p-2.5 backdrop-blur-sm sm:rounded-lg sm:p-6">
            <dt className="text-[10px] leading-tight text-paper/70 sm:text-sm">{stat.label}</dt>
            <dd className="mt-1 font-display text-lg text-sunshine sm:mt-2 sm:text-3xl">{stat.valueDisplay}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export function ProgramCards({
  heading,
  programs,
}: {
  heading?: string;
  programs: {
    slug: string;
    name: string;
    shortDescription: string;
    featuredImageUrl: string | null;
    status?: string;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
  }[];
}) {
  return (
    <Section>
      {heading ? <h2 className="editorial-rule font-display text-2xl sm:text-4xl lg:text-5xl">{heading}</h2> : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => {
          const active =
            program.status === undefined
              ? true
              : program.status === "published" &&
                !(program.startsAt && new Date(program.startsAt).getTime() > Date.now()) &&
                !(program.endsAt && new Date(program.endsAt).getTime() < Date.now());
          return (
          <MediaCard key={program.slug} href={`/our-work/${program.slug}`} imageUrl={program.featuredImageUrl}>
            <p className="text-[10px] font-semibold tracking-wide text-accent uppercase sm:text-xs">{active ? "Active" : "Inactive"}</p>
            <h3 className="mt-0.5 font-display text-sm text-brand sm:mt-2 sm:text-xl">{program.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm">{program.shortDescription}</p>
            <span className="mt-2 inline-block text-xs font-semibold text-brand sm:mt-4">Read more</span>
          </MediaCard>
          );
        })}
      </div>
    </Section>
  );
}

export function StoryCards({
  heading,
  stories,
}: {
  heading?: string;
  stories: { slug: string; title: string; excerpt: string; featuredImageUrl: string | null }[];
}) {
  return (
    <Section>
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl sm:text-3xl">{heading ?? "Stories of change"}</h2>
        <ButtonLink href="/stories" variant="ghost" size="sm">
          All stories
        </ButtonLink>
      </div>
      <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-6 md:grid-cols-3">
        {stories.map((story) => (
          <MediaCard key={story.slug} href={`/stories/${story.slug}`} imageUrl={story.featuredImageUrl} imageAlt={story.title}>
            <h3 className="font-display text-sm text-brand sm:text-xl">{story.title}</h3>
            <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">{story.excerpt}</p>
            <span className="mt-2 inline-block text-xs font-semibold text-brand sm:mt-4">Read the story</span>
          </MediaCard>
        ))}
      </div>
    </Section>
  );
}

export function CtaBanner({
  heading,
  items,
}: {
  heading: string;
  items: { title: string; href: string; body: string }[];
}) {
  return (
    <Section className="bg-brand text-paper">
      <h2 className="font-display text-2xl sm:text-4xl">{heading}</h2>
      <div className="mt-5 divide-y divide-paper/15 overflow-hidden rounded-lg border border-paper/15 md:mt-8 md:grid md:grid-cols-3 md:gap-4 md:divide-y-0 md:overflow-visible md:border-0">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block px-3 py-3 transition hover:bg-paper/10 md:rounded-lg md:border md:border-paper/15 md:bg-paper/5 md:p-5"
          >
            <h3 className="font-display text-base md:text-xl">{item.title}</h3>
            <p className="mt-1 text-xs text-paper/80 md:mt-2 md:text-sm">{item.body}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}

export function DonateCta({
  heading = "Support the work",
  body,
  href = "/donate",
  label = "Give now",
}: {
  heading?: string;
  body: string;
  href?: string;
  label?: string;
}) {
  return (
    <Section className="bg-sunshine/20">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2>
        <p className="mt-2 text-sm text-muted sm:mt-4 sm:text-base">{body}</p>
        <ButtonLink href={href} className="mt-4 sm:mt-6" variant="primary">
          {label}
        </ButtonLink>
      </div>
    </Section>
  );
}

export function CopySection({
  heading,
  children,
  className,
}: {
  heading?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Section className={className ?? "py-8 lg:py-16"}>
      {heading ? <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2> : null}
      <div className="rich-content mt-4">{children}</div>
    </Section>
  );
}

const PEOPLE_GROUP_LABEL: Record<string, string> = {
  board: "Board",
  executive: "Executive",
  advisor: "Advisor",
};

function personInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PeopleGrid({
  heading = "Leadership",
  intro,
  people,
}: {
  heading?: string;
  intro?: string;
  people: {
    id: string;
    name: string;
    position: string;
    bio: string;
    group: string;
    photoUrl?: string | null;
    responsibility?: string | null;
  }[];
}) {
  if (!people.length) return null;
  return (
    <Section>
      <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2>
      {intro ? <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{intro}</p> : null}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
        {people.map((person) => (
          <Card key={person.id} className="p-3 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand/10 sm:h-24 sm:w-24"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-paper sm:h-24 sm:w-24 sm:text-lg"
                >
                  {personInitials(person.name)}
                </span>
              )}
              <div className="min-w-0">
                <Badge>{PEOPLE_GROUP_LABEL[person.group] ?? person.group}</Badge>
                <h3 className="mt-1 font-display text-base text-brand sm:mt-2 sm:text-xl">{person.name}</h3>
                <p className="text-xs text-accent sm:text-sm">{person.position}</p>
              </div>
            </div>
            {person.responsibility ? (
              <p className="mt-3 text-[10px] font-semibold tracking-wide text-muted uppercase sm:mt-4 sm:text-xs">{person.responsibility}</p>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-muted sm:mt-3 sm:text-sm">{person.bio}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function FaqList({
  heading = "Questions",
  faqs,
}: {
  heading?: string;
  faqs: { id?: string; question: string; answer: string }[];
}) {
  return (
    <Section>
      <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2>
      <div className="mt-5 divide-y divide-brand/10 border-y border-brand/10 sm:mt-8">
        {faqs.map((item, index) => (
          <details key={item.id ?? `${item.question}-${index}`} className="group py-3 sm:py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold marker:hidden">
              {item.question}
              <span className="text-xl text-sunshine transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function LegalBody({ heading, body }: { heading: string; body: string }) {
  return (
    <Section className="py-8 lg:py-16">
      <h1 className="font-display text-2xl sm:text-4xl">{heading}</h1>
      <div
        className="rich-content mt-6"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(editorHtml(body)) }}
      />
    </Section>
  );
}
