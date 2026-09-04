import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Kicker, Section } from "@/components/blocks/section";
import { MediaFrame } from "@/components/blocks/media-frame";
import { getPublishedPrograms } from "@/lib/content/programs";
import { getPublicImpactStats, getPublishedFaqs, getPublishedPeople } from "@/lib/content/settings";
import { getPublishedStories } from "@/lib/content/stories";
import { asArray, asString } from "@/lib/format";
import { editorHtml, sanitizeRichText } from "@/lib/rich-text";
import type { PageBlockType } from "@/db/schema/pages";

type Block = {
  id?: string;
  type: PageBlockType | string;
  data: Record<string, unknown>;
};

export async function BlockRenderer({ blocks }: { blocks: Block[] }) {
  const needsPrograms = blocks.some(
    (block) => block.type === "card_grid" && asString(block.data.source) === "programs",
  );
  const needsStories = blocks.some((block) => block.type === "stories");
  const needsStats = blocks.some((block) => block.type === "stat_strip");
  const needsPeople = blocks.some((block) => block.type === "people");
  const needsFaq = blocks.some((block) => block.type === "faq");

  const [programs, stories, stats, people, faqs] = await Promise.all([
    needsPrograms ? getPublishedPrograms() : Promise.resolve([]),
    needsStories ? getPublishedStories("stories_of_change") : Promise.resolve([]),
    needsStats ? getPublicImpactStats() : Promise.resolve([]),
    needsPeople ? getPublishedPeople() : Promise.resolve([]),
    needsFaq ? getPublishedFaqs() : Promise.resolve([]),
  ]);

  return (
    <>
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.type}-${index}`;
        switch (block.type) {
          case "hero":
            return <HeroBlock key={key} data={block.data} />;
          case "problem":
            return <ProblemBlock key={key} data={block.data} />;
          case "stat_strip":
            return <StatStripBlock key={key} data={block.data} stats={stats} />;
          case "card_grid":
            return (
              <CardGridBlock
                key={key}
                data={block.data}
                programs={programs}
              />
            );
          case "gallery":
            return <GalleryBlock key={key} data={block.data} />;
          case "map":
            return <MapBlock key={key} data={block.data} />;
          case "testimonial":
            return <TestimonialBlock key={key} data={block.data} />;
          case "rich_text":
            return <RichTextBlock key={key} data={block.data} />;
          case "cta_banner":
            return <CtaBannerBlock key={key} data={block.data} />;
          case "donate":
            return <DonateBlock key={key} data={block.data} />;
          case "stories":
            return <StoriesBlock key={key} data={block.data} stories={stories} />;
          case "people":
            return <PeopleBlock key={key} data={block.data} people={people} />;
          case "faq":
            return <FaqBlock key={key} data={block.data} faqs={faqs} />;
          case "video":
            return <VideoBlock key={key} data={block.data} />;
          default:
            return null;
        }
      })}
    </>
  );
}

function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const imageUrl = asString(data.imageUrl);
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
        {asString(data.kicker) ? (
          <p className="eyebrow text-sunshine">
            {asString(data.kicker)}
          </p>
        ) : null}
        <div className="mb-6 h-px w-14 bg-sunshine" />
        <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-balance sm:text-6xl lg:text-7xl">
          {asString(data.headline)}
        </h1>
        {asString(data.subheadline) ? (
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-paper/88 lg:text-xl">
            {asString(data.subheadline)}
          </p>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          {asString(data.primaryHref) ? (
            <ButtonLink href={asString(data.primaryHref)} variant="sunshine" size="lg">
              {asString(data.primaryLabel, "Continue")}
            </ButtonLink>
          ) : null}
          {asString(data.secondaryHref) ? (
            <ButtonLink href={asString(data.secondaryHref)} variant="outline" size="lg" className="border-paper/40 bg-transparent text-paper hover:bg-paper/10">
              {asString(data.secondaryLabel, "Learn more")}
            </ButtonLink>
          ) : null}
        </div>
        </div>
      </div>
    </section>
  );
}

function ProblemBlock({ data }: { data: Record<string, unknown> }) {
  const items = asArray<{ title: string; body: string }>(data.items);
  return (
    <Section className="surface-grid bg-canvas">
      <Kicker>The problem</Kicker>
      <h2 className="editorial-rule mt-3 max-w-3xl font-display text-4xl text-balance sm:text-5xl">
        {asString(data.heading)}
      </h2>
      {asString(data.intro) ? (
        <p className="mt-4 max-w-2xl text-lg text-muted">{asString(data.intro)}</p>
      ) : null}
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

function StatStripBlock({
  data,
  stats,
}: {
  data: Record<string, unknown>;
  stats: { key: string; label: string; valueDisplay: string }[];
}) {
  return (
    <Section className="bg-brand text-paper">
      {asString(data.heading) ? (
        <h2 className="font-display text-3xl">{asString(data.heading)}</h2>
      ) : null}
      {asString(data.note) ? (
        <p className="mt-3 max-w-2xl text-sm text-paper/70">{asString(data.note)}</p>
      ) : null}
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

function CardGridBlock({
  data,
  programs,
}: {
  data: Record<string, unknown>;
  programs: { slug: string; name: string; shortDescription: string; featuredImageUrl: string | null }[];
}) {
  const source = asString(data.source);
  const cards =
    source === "programs"
      ? programs.map((program) => ({
          title: program.name,
          body: program.shortDescription,
          href: `/our-work/${program.slug}`,
          imageUrl: program.featuredImageUrl,
        }))
      : asArray<{ title: string; body: string; href?: string; imageUrl?: string }>(data.items);

  return (
    <Section>
      {asString(data.heading) ? (
        <h2 className="editorial-rule font-display text-4xl sm:text-5xl">{asString(data.heading)}</h2>
      ) : null}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="editorial-card transition hover:-translate-y-1">
            {card.imageUrl ? (
              <div className="relative aspect-[16/10]">
                <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="400px" />
              </div>
            ) : null}
            <div className="p-5">
              <h3 className="font-display text-xl text-brand">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
              {card.href ? (
                <ButtonLink href={card.href} variant="ghost" size="sm" className="mt-4 px-0">
                  Read more
                </ButtonLink>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function GalleryBlock({ data }: { data: Record<string, unknown> }) {
  const images = asArray<string>(data.images);
  if (!images.length) return null;
  return (
    <Section>
      {asString(data.heading) ? (
        <h2 className="mb-8 font-display text-3xl">{asString(data.heading)}</h2>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src) => (
          <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-mist">
            <Image src={src} alt="" fill className="object-cover" sizes="400px" />
          </div>
        ))}
      </div>
    </Section>
  );
}

function MapBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section className="bg-mist">
      <h2 className="font-display text-3xl">{asString(data.heading, "Where the work is happening")}</h2>
      <p className="mt-3 max-w-2xl text-muted">
        {asString(data.body, "Open the Global Ambassador Network for country counts and consenting profiles.")}
      </p>
      <ButtonLink href="/love-ambassadors/network" className="mt-6">
        View the network map
      </ButtonLink>
    </Section>
  );
}

function TestimonialBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section>
      <blockquote className="mx-auto max-w-3xl text-center">
        <p className="font-display text-2xl text-balance sm:text-3xl">
          “{asString(data.quote)}”
        </p>
        <footer className="mt-6 text-sm text-muted">
          {asString(data.attribution)}
        </footer>
      </blockquote>
    </Section>
  );
}

function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section className="py-12 lg:py-16">
      {asString(data.heading) ? (
        <h2 className="font-display text-3xl">{asString(data.heading)}</h2>
      ) : null}
      <div className="rich-content mt-4" dangerouslySetInnerHTML={{ __html: sanitizeRichText(editorHtml(asString(data.body))) }} />
    </Section>
  );
}

function CtaBannerBlock({ data }: { data: Record<string, unknown> }) {
  const items = asArray<{ title: string; href: string; body: string }>(data.items);
  return (
    <Section className="bg-brand text-paper">
      <h2 className="font-display text-3xl sm:text-4xl">{asString(data.heading)}</h2>
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

function DonateBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section className="bg-sunshine/20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl">{asString(data.heading, "Support the work")}</h2>
        <p className="mt-4 text-muted">{asString(data.body)}</p>
        <ButtonLink href={asString(data.href, "/donate")} className="mt-6" variant="primary">
          {asString(data.label, "Give now")}
        </ButtonLink>
      </div>
    </Section>
  );
}

function StoriesBlock({
  data,
  stories,
}: {
  data: Record<string, unknown>;
  stories: {
    slug: string;
    title: string;
    excerpt: string;
    featuredImageUrl: string | null;
  }[];
}) {
  const limit = Number(data.limit ?? 3);
  const items = stories.slice(0, Number.isFinite(limit) ? limit : 3);
  return (
    <Section>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl">{asString(data.heading, "Stories of change")}</h2>
        <ButtonLink href="/stories" variant="ghost" size="sm">
          All stories
        </ButtonLink>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map((story) => (
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

function PeopleBlock({
  data,
  people,
}: {
  data: Record<string, unknown>;
  people: { name: string; position: string; bio: string; group: string }[];
}) {
  return (
    <Section>
      <h2 className="font-display text-3xl">{asString(data.heading, "People")}</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {people.map((person) => (
          <Card key={person.name} className="editorial-card p-5">
            <Badge>{person.group}</Badge>
            <h3 className="mt-3 font-display text-xl">{person.name}</h3>
            <p className="text-sm text-accent">{person.position}</p>
            <p className="mt-3 text-sm text-muted">{person.bio}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function FaqBlock({
  data,
  faqs,
}: {
  data: Record<string, unknown>;
  faqs: { id?: string; question: string; answer: string }[];
}) {
  return (
    <Section>
      <h2 className="font-display text-3xl">{asString(data.heading, "Questions")}</h2>
      <div className="mt-8 divide-y divide-brand/10 border-y border-brand/10">
        {faqs.map((item, index) => (
          <details key={item.id ?? `${item.question}-${index}`} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold marker:hidden">
              {item.question}<span className="text-xl text-sunshine transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function VideoBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <Section>
      {asString(data.heading) ? (
        <h2 className="mb-6 font-display text-3xl">{asString(data.heading)}</h2>
      ) : null}
      <MediaFrame
        youtubeUrl={asString(data.youtubeUrl)}
        src={asString(data.imageUrl) || null}
        alt={asString(data.heading, "Video")}
        className="relative aspect-video overflow-hidden rounded-lg bg-mist"
      />
    </Section>
  );
}
