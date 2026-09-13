import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
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
      <div aria-hidden="true" className="absolute -bottom-20 right-[8%] h-72 w-72 rounded-full border border-paper/20" />
      <div aria-hidden="true" className="absolute -bottom-10 right-[12%] h-52 w-52 rounded-full border border-paper/15" />
      <div className="relative mx-auto flex min-h-[500px] max-w-7xl items-center px-4 py-20 lg:min-h-[570px] lg:px-8 lg:py-24">
        <div className="reveal">
          {kicker ? <p className="eyebrow text-sunshine">{kicker}</p> : null}
          <div className="mb-6 h-px w-14 bg-sunshine" />
          <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-balance sm:text-6xl lg:text-7xl">
            {headline}
          </h1>
          {subheadline ? (
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-paper/88 lg:text-xl">{subheadline}</p>
          ) : null}
          <div className="mt-10 flex flex-wrap gap-3">
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
      <h2 className="editorial-rule mt-3 max-w-3xl font-display text-4xl text-balance sm:text-5xl">{heading}</h2>
      {intro ? <p className="mt-4 max-w-2xl text-lg text-muted">{intro}</p> : null}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="editorial-card bg-paper p-6 transition hover:-translate-y-1">
            <h3 className="font-display text-xl text-brand">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
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
      {heading ? <h2 className="font-display text-3xl">{heading}</h2> : null}
      {note ? <p className="mt-3 max-w-2xl text-sm text-paper/70">{note}</p> : null}
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.key} className="rounded-lg border border-paper/15 bg-paper/8 p-6 backdrop-blur-sm">
            <dt className="text-sm text-paper/70">{stat.label}</dt>
            <dd className="mt-2 font-display text-3xl text-sunshine">{stat.valueDisplay}</dd>
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
      {heading ? <h2 className="editorial-rule font-display text-4xl sm:text-5xl">{heading}</h2> : null}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => {
          const active =
            program.status === undefined
              ? true
              : program.status === "published" &&
                !(program.startsAt && new Date(program.startsAt).getTime() > Date.now()) &&
                !(program.endsAt && new Date(program.endsAt).getTime() < Date.now());
          return (
          <Card key={program.slug} className="editorial-card transition hover:-translate-y-1">
            {program.featuredImageUrl ? (
              <div className="relative aspect-[16/10]">
                <Image src={program.featuredImageUrl} alt="" fill className="object-cover" sizes="400px" />
              </div>
            ) : null}
            <div className="p-5">
              <p className="text-xs font-semibold tracking-wide uppercase text-accent">{active ? "Active" : "Inactive"}</p>
              <h3 className="mt-2 font-display text-xl text-brand">{program.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{program.shortDescription}</p>
              <ButtonLink href={`/our-work/${program.slug}`} variant="ghost" size="sm" className="mt-4 min-h-11 px-0">
                Read more
              </ButtonLink>
            </div>
          </Card>
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
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl">{heading ?? "Stories of change"}</h2>
        <ButtonLink href="/stories" variant="ghost" size="sm">
          All stories
        </ButtonLink>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {stories.map((story) => (
          <Card key={story.slug}>
            {story.featuredImageUrl ? (
              <div className="relative aspect-[16/10]">
                <Image src={story.featuredImageUrl} alt="" fill className="object-cover" sizes="400px" />
              </div>
            ) : null}
            <div className="p-5">
              <h3 className="font-display text-xl text-brand">{story.title}</h3>
              <p className="mt-2 text-sm text-muted">{story.excerpt}</p>
              <ButtonLink href={`/stories/${story.slug}`} variant="ghost" size="sm" className="mt-4 px-0">
                Read the story
              </ButtonLink>
            </div>
          </Card>
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
      <h2 className="font-display text-3xl sm:text-4xl">{heading}</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-lg border border-paper/15 bg-paper/5 p-5 transition hover:bg-paper/10"
          >
            <h3 className="font-display text-xl">{item.title}</h3>
            <p className="mt-2 text-sm text-paper/80">{item.body}</p>
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
        <h2 className="font-display text-3xl">{heading}</h2>
        <p className="mt-4 text-muted">{body}</p>
        <ButtonLink href={href} className="mt-6" variant="primary">
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
    <Section className={className ?? "py-12 lg:py-16"}>
      {heading ? <h2 className="font-display text-3xl">{heading}</h2> : null}
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
      <h2 className="font-display text-3xl">{heading}</h2>
      {intro ? <p className="mt-2 max-w-2xl text-muted">{intro}</p> : null}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {people.map((person) => (
          <Card key={person.id} className="editorial-card p-5 transition hover:-translate-y-1">
            <div className="flex items-start gap-4">
              {person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photoUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-brand/10 sm:h-24 sm:w-24"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand text-lg font-semibold text-paper sm:h-24 sm:w-24"
                >
                  {personInitials(person.name)}
                </span>
              )}
              <div className="min-w-0">
                <Badge>{PEOPLE_GROUP_LABEL[person.group] ?? person.group}</Badge>
                <h3 className="mt-2 font-display text-xl text-brand">{person.name}</h3>
                <p className="text-sm text-accent">{person.position}</p>
              </div>
            </div>
            {person.responsibility ? (
              <p className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">{person.responsibility}</p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-muted">{person.bio}</p>
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
      <h2 className="font-display text-3xl">{heading}</h2>
      <div className="mt-8 divide-y divide-brand/10 border-y border-brand/10">
        {faqs.map((item, index) => (
          <details key={item.id ?? `${item.question}-${index}`} className="group py-5">
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
    <Section className="py-12 lg:py-16">
      <h1 className="font-display text-4xl">{heading}</h1>
      <div
        className="rich-content mt-6"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(editorHtml(body)) }}
      />
    </Section>
  );
}
