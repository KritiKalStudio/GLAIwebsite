import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { DonateNowForm } from "@/components/forms/donate-now-form";
import { MediaFrame } from "@/components/blocks/media-frame";
import { Kicker, Section } from "@/components/blocks/section";
import { JsonLd } from "@/components/json-ld";
import { getSessionUser } from "@/lib/auth";
import { decryptField } from "@/lib/crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import {
  campaignWindowLabel,
  getPublishedProgram,
  getPublishedPrograms,
  getRaisedByProgramIds,
  isCampaignActive,
} from "@/lib/content/programs";
import { getSiteSettings } from "@/lib/content/settings";
import { getSiteUrl } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/structured-data";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await getPublishedProgram(slug);
  return {
    title: program?.name ?? "Program",
    description: program?.shortDescription,
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [program, settings, user, programs] = await Promise.all([
    getPublishedProgram(slug),
    getSiteSettings(),
    getSessionUser(),
    getPublishedPrograms(),
  ]);
  if (!program) notFound();
  const raisedBy = await getRaisedByProgramIds([program.id]);
  const raised = raisedBy[program.id] ?? 0;
  const goal = Number(program.goalAmount ?? 0) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const otherPrograms = programs.filter((item) => item.slug !== program.slug).slice(0, 5);
  const url = `${getSiteUrl()}/our-work/${program.slug}`;
  const orgName = settings?.orgName ?? "Global Love Ambassadors Initiative";
  const active = isCampaignActive(program);
  const [profile] =
    user?.ambassadorId && !user.roleSlug
      ? await getDb().select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1)
      : [];
  const member =
    user && profile
      ? {
          name: profile.fullName,
          email: user.email,
          phone: decryptField(profile.whatsapp ?? profile.phone) ?? "",
          organization: profile.organization ?? "",
        }
      : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOccupationalProgram",
          name: program.name,
          description: program.shortDescription,
          url,
          provider: { "@type": "NGO", name: orgName, url: getSiteUrl() },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: getSiteUrl() },
          { name: "Our Work", url: `${getSiteUrl()}/our-work` },
          { name: program.name, url },
        ])}
      />
      <Section className="bg-brand text-paper">
        <Kicker>Our Work</Kicker>
        <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-5xl">{program.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-paper/85">{program.shortDescription}</p>
        {program.applyHref ? (
          <ButtonLink href={program.applyHref} variant="sunshine" className="mt-8">
            {program.applyCtaLabel ?? "Take part"}
          </ButtonLink>
        ) : null}
      </Section>
      <MediaFrame
        src={program.featuredImageUrl}
        youtubeUrl={program.youtubeUrl}
        alt={program.name}
        className="relative mx-auto mt-0 aspect-[21/9] max-w-6xl overflow-hidden bg-mist lg:rounded-b-lg"
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <article className="space-y-8 lg:col-span-2">
            <div>
              <h2 className="font-display text-2xl">Purpose</h2>
              <p className="mt-2 leading-relaxed text-muted">{program.purpose}</p>
            </div>
            {program.whoCanParticipate ? (
              <div>
                <h2 className="font-display text-2xl">Who can participate</h2>
                <p className="mt-2 leading-relaxed text-muted">{program.whoCanParticipate}</p>
              </div>
            ) : null}
            {program.curriculum.length ? (
              <div>
                <h2 className="font-display text-2xl">Curriculum</h2>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted">
                  {program.curriculum.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {program.process ? (
              <div>
                <h2 className="font-display text-2xl">Process</h2>
                <p className="mt-2 leading-relaxed text-muted">{program.process}</p>
              </div>
            ) : null}
            {program.outcomes ? (
              <div>
                <h2 className="font-display text-2xl">Outcomes</h2>
                <p className="mt-2 leading-relaxed text-muted">{program.outcomes}</p>
              </div>
            ) : null}
            <div id="sponsor" className="rounded-2xl border border-brand/10 bg-mist p-5 sm:p-7">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                {active ? "Active campaign" : "Campaign"} · {campaignWindowLabel(program)}
              </p>
              <h2 className="mt-2 font-display text-2xl">Sponsor this program</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Read the work above, then give once. Visitors can donate without an account. Members only choose whether
                the gift is anonymous.
              </p>
              <DonateNowForm programSlug={program.slug} member={member} bank={settings?.payment?.bank ?? null} />
            </div>
          </article>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-brand/10 bg-mist p-5 sm:p-6">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                {active ? "Active now" : "Not in campaign window"}
              </p>
              <h2 className="mt-2 font-display text-2xl text-brand">{program.name}</h2>
              <p className="mt-2 text-sm text-muted">{campaignWindowLabel(program)}</p>
              {goal > 0 ? (
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {formatMoney(raised, program.currency)} raised of {formatMoney(goal, program.currency)}
                  </p>
                </div>
              ) : raised > 0 ? (
                <p className="mt-4 text-sm text-muted">{formatMoney(raised, program.currency)} raised so far</p>
              ) : null}
              {program.whoCanParticipate ? (
                <div className="mt-5 border-t border-brand/10 pt-4">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Who can take part</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{program.whoCanParticipate}</p>
                </div>
              ) : null}
              <div className="mt-5 grid grid-cols-1 gap-2">
                {program.applyHref ? (
                  <ButtonLink href={program.applyHref} variant="primary" className="min-h-11 w-full">
                    {program.applyCtaLabel ?? "Take part"}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="#sponsor" variant="sunshine" className="min-h-11 w-full">
                  Donate now
                </ButtonLink>
                <ButtonLink href="/donate#sponsor" variant="outline" className="min-h-11 w-full">
                  All programs
                </ButtonLink>
              </div>
            </div>
            {otherPrograms.length ? (
              <div className="rounded-2xl border border-brand/10 bg-paper p-5 sm:p-6">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Other programs</p>
                <ul className="mt-3 grid gap-3">
                  {otherPrograms.map((item) => (
                    <li key={item.id}>
                      <Link href={`/our-work/${item.slug}`} className="group block min-h-11">
                        <span className="font-display text-lg text-brand group-hover:underline">{item.name}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {isCampaignActive(item) ? "Active campaign" : "Inactive"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>
    </>
  );
}
