import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { toggleDirectoryConsent, updateAmbassadorProfile } from "@/app/actions/ambassadors";
import { logoutAction } from "@/app/actions/auth";
import { toggleVolunteerRole } from "@/app/actions/volunteers";
import { Button } from "@/components/ui/button";
import { MembershipPlaceFields } from "@/components/forms/membership-place-fields";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/card";
import { Section } from "@/components/blocks/section";
import { MemberDashboardNav } from "@/components/referrals/member-nav";
import { ReferralShare } from "@/components/referrals/referral-share";
import { TierMedal } from "@/components/referrals/tier-medal";
import { getDb } from "@/db";
import { ambassadors, volunteerApplications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { decryptField } from "@/lib/crypto";
import { getActivePrograms } from "@/lib/content/programs";
import { getUpcomingEvents } from "@/lib/content/events";
import { getPublishedOpportunitiesWithSlots } from "@/lib/content/volunteers";
import { formatDate } from "@/lib/format";
import { getRequestSiteUrl } from "@/lib/env";
import { REFERRAL_TIERS, referralProgress, referralSignupPath } from "@/lib/referral-tiers";
import { ensureReferralCode, loadReferralBoard } from "@/lib/referrals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Member dashboard", robots: { index: false, follow: false } };

function noticeCopy(notice?: string) {
  if (notice === "welcome") return "Welcome in. Your membership is active.";
  if (notice === "role-assigned") return "You are signed up for the volunteer role you chose.";
  if (notice === "role-full") {
    return "That volunteer role is full. Other open roles are listed below — apply for one of those instead.";
  }
  return null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; suggest?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.ambassadorId) {
    if (user.roleSlug) redirect("/admin");
    redirect("/signup");
  }

  const { notice, suggest } = await searchParams;
  const db = getDb();
  const [profile] = await db.select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1);
  const [events, campaigns, opportunities, myApps] = await Promise.all([
    getUpcomingEvents(),
    getActivePrograms(),
    getPublishedOpportunitiesWithSlots(),
    db
      .select()
      .from(volunteerApplications)
      .where(
        and(
          eq(volunteerApplications.userId, user.id),
          inArray(volunteerApplications.status, ["accepted", "applied"]),
        ),
      ),
  ]);
  const applied = new Set(myApps.map((row) => row.opportunityId));
  const suggested = new Set((suggest ?? "").split(",").filter(Boolean));
  const message = noticeCopy(notice);
  const referralCode = profile.referralCode ?? (await ensureReferralCode(profile.id));
  const board = await loadReferralBoard();
  const standing = board.find((row) => row.id === profile.id);
  const referralCount = standing?.referralCount ?? 0;
  const progress = referralProgress(referralCount);
  const referralLink = referralCode ? `${await getRequestSiteUrl()}${referralSignupPath(referralCode)}` : "";
  const preview = board.slice(0, 5);

  return (
    <Section className="space-y-6 bg-canvas px-4 sm:space-y-12">
      <MemberDashboardNav current="home" />
      {message ? (
        <p className="rounded-lg bg-hope/20 px-3 py-2.5 text-sm font-medium text-ink sm:rounded-xl sm:px-4 sm:py-3" role="status">
          {message}
        </p>
      ) : null}
      <div className="relative overflow-hidden rounded-xl bg-brand px-4 py-5 text-paper sm:rounded-2xl sm:px-9 sm:py-9 sm:shadow-[0_24px_60px_rgba(16,42,67,.18)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div>
            <p className="eyebrow text-sunshine">My space</p>
            <h1 className="mt-2 font-display text-2xl sm:mt-3 sm:text-5xl">Welcome, {profile.fullName}</h1>
            <p className="mt-2 max-w-xl text-sm text-paper/75 sm:mt-3 sm:text-base">Events, active campaigns, and volunteer roles — all in one place.</p>
            <p className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5">
              <Badge tone="sunshine">Active member</Badge>
              {progress.tier ? <Badge tone="brand">{progress.tier.name}</Badge> : null}
            </p>
          </div>
          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-paper/25 bg-transparent text-paper hover:bg-paper/10 hover:text-paper sm:w-auto"
              type="submit"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="p-4 sm:p-8">
          <p className="eyebrow">Invite</p>
          <h2 className="mt-2 font-display text-xl sm:text-2xl">Your referral link</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Share your code or link. When someone finishes registration with it, they count toward your honour.
          </p>
          {referralCode ? (
            <ReferralShare code={referralCode} link={referralLink} />
          ) : (
            <p className="mt-4 text-sm text-muted">Your code is being prepared. Refresh this page in a moment.</p>
          )}
        </Card>
        <Card className="p-4 sm:p-8">
          <p className="eyebrow">Standing</p>
          <h2 className="mt-2 font-display text-xl sm:text-2xl">
            {referralCount.toLocaleString()} {referralCount === 1 ? "referral" : "referrals"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {standing ? `You are ranked #${standing.rank} of ${board.length}.` : "Your rank will appear once your membership is counted."}{" "}
            <a className="font-semibold text-accent underline" href="/dashboard/leaderboard">
              Open the leaderboard
            </a>
          </p>
          <div className="mt-4 flex items-center gap-3">
            {progress.tier ? <TierMedal tier={progress.tier} state="current" size="sm" /> : null}
            <p className="text-sm text-ink">{progress.label}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-8">
        <h2 className="font-display text-xl sm:text-2xl">Referral honours</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Eight honours. Each one asks for more new members than the last, from a single signup to 1,500.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {REFERRAL_TIERS.map((tier) => {
            const state = progress.tier?.slug === tier.slug ? "current" : referralCount >= tier.threshold ? "earned" : "locked";
            return (
              <li key={tier.slug} className="flex justify-center">
                <TierMedal tier={tier} state={state} />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-4 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl">Referral leaderboard</h2>
            <p className="mt-2 text-sm text-muted">Members with completed signups through their code. Ties go to whoever reached that number first.</p>
          </div>
          <a className="text-sm font-semibold text-accent underline" href="/dashboard/leaderboard">
            Full ranking
          </a>
        </div>
        <ol className="mt-4 divide-y divide-brand/10">
          {preview.length ? (
            preview.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="mr-2 font-semibold tabular-nums text-muted">#{row.rank}</span>
                  <span className="font-semibold">{row.fullName}</span>
                  {row.id === profile.id ? <span className="ml-2 text-xs font-semibold tracking-wide text-accent uppercase">You</span> : null}
                  <span className="mt-0.5 block text-muted sm:mt-0 sm:ml-2 sm:inline">{row.country}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums">{row.referralCount.toLocaleString()}</span>
                  <span className="text-xs text-muted">{row.tier?.name ?? "—"}</span>
                </span>
              </li>
            ))
          ) : (
            <li className="py-3 text-sm text-muted">No registered members to rank yet.</li>
          )}
        </ol>
      </Card>

      <Card className="p-4 sm:p-8">
        <h2 className="font-display text-xl sm:text-2xl">Profile</h2>
        <form action={updateAmbassadorProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName">
            <TextInput id="fullName" name="fullName" defaultValue={profile.fullName} />
          </Field>
          <Field label="WhatsApp number" name="whatsapp">
            <TextInput id="whatsapp" name="whatsapp" defaultValue={decryptField(profile.whatsapp ?? profile.phone) ?? ""} />
          </Field>
          <Field label="Age" name="age">
            <TextInput id="age" name="age" type="number" defaultValue={profile.age ?? ""} />
          </Field>
          <div className="sm:col-span-2 grid gap-4">
            <MembershipPlaceFields
              defaults={{
                nationality: profile.nationality ?? profile.country,
                country: profile.country,
                stateOfOrigin: profile.stateOfOrigin ?? "",
                localGovernment: profile.localGovernment ?? "",
                electoralWard: profile.electoralWard ?? "",
                pollingUnit: profile.pollingUnit ?? "",
                religion: profile.religion ?? "",
              }}
            />
          </div>
          <Field label="Tribe" name="tribe">
            <TextInput id="tribe" name="tribe" defaultValue={profile.tribe ?? ""} />
          </Field>
          <Field label="Education" name="education">
            <TextInput id="education" name="education" defaultValue={profile.education ?? ""} />
          </Field>
          <Field label="Occupation" name="occupation">
            <TextInput id="occupation" name="occupation" defaultValue={profile.occupation ?? profile.profession ?? ""} />
          </Field>
          <Field label="Organization" name="organization">
            <TextInput id="organization" name="organization" defaultValue={profile.organization ?? ""} />
          </Field>
          <Field label="Current address" name="currentAddress" className="sm:col-span-2">
            <TextArea id="currentAddress" name="currentAddress" defaultValue={profile.currentAddress ?? ""} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto">
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 sm:p-8">
        <h2 className="font-display text-xl sm:text-2xl">Network directory consent</h2>
        <p className="mt-2 text-sm text-muted">
          You are always counted in {profile.country}&apos;s total. Your name appears publicly only if you opt in.
        </p>
        <form action={toggleDirectoryConsent} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="consent" defaultChecked={profile.consentToDirectory} />
            Show my name on the public network
          </label>
          <Button type="submit" size="sm" className="w-full sm:w-auto">
            Update consent
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 sm:gap-y-10">
        <Card className="p-4 sm:p-6">
          <h2 className="font-display text-xl sm:text-2xl">Upcoming events</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {events.length ? (
              events.map((event) => (
                <li key={event.id}>
                  <a className="font-semibold text-brand underline" href={`/events/${event.slug}`}>
                    {event.title}
                  </a>
                  <span className="block text-muted sm:inline sm:before:content-['·_']">{formatDate(event.startsAt)}</span>
                </li>
              ))
            ) : (
              <li className="text-muted">No upcoming events yet.</li>
            )}
          </ul>
        </Card>
        <Card className="p-4 sm:p-6">
          <h2 className="font-display text-xl sm:text-2xl">Active campaigns</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {campaigns.length ? (
              campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <a className="font-semibold text-brand underline" href={`/our-work/${campaign.slug}`}>
                    {campaign.name}
                  </a>
                </li>
              ))
            ) : (
              <li className="text-muted">No campaigns are in their active period right now.</li>
            )}
          </ul>
        </Card>
        <Card className="p-4 sm:col-span-2 sm:p-6">
          <h2 className="font-display text-xl sm:text-2xl">Volunteer opportunities</h2>
          <ul className="mt-4 grid gap-3 sm:gap-4">
            {opportunities.map((role) => {
              const mine = applied.has(role.id);
              const highlight = suggested.has(role.slug);
              return (
                <li
                  key={role.id}
                  className={`rounded-lg border p-3 sm:rounded-xl sm:p-4 ${highlight ? "border-accent bg-mist" : "border-brand/10"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{role.title}</p>
                      <p className="mt-1 text-sm text-muted">{role.description}</p>
                      <p className="mt-2 text-xs text-accent">
                        {role.remaining} of {role.slots} slots open
                        {role.location ? ` · ${role.location}` : ""}
                      </p>
                    </div>
                    <form action={toggleVolunteerRole} className="sm:shrink-0">
                      <input type="hidden" name="opportunityId" value={role.id} />
                      <input type="hidden" name="intent" value={mine ? "unapply" : "apply"} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={mine ? "outline" : "primary"}
                        className="w-full sm:w-auto"
                        disabled={!mine && role.remaining <= 0}
                      >
                        {mine ? "Un-apply" : role.remaining <= 0 ? "Full" : "Apply"}
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
            {opportunities.length === 0 ? <li className="text-sm text-muted">No published roles right now.</li> : null}
          </ul>
        </Card>
      </div>
    </Section>
  );
}
