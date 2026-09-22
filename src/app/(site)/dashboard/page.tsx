import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { toggleVolunteerRole } from "@/app/actions/volunteers";
import { DashboardNotice } from "@/components/dashboard/heading";
import { Badge } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { ambassadors, volunteerApplications } from "@/db/schema";
import { getUpcomingEvents } from "@/lib/content/events";
import { getActivePrograms } from "@/lib/content/programs";
import { getPublishedOpportunitiesWithSlots } from "@/lib/content/volunteers";
import { formatDate } from "@/lib/format";
import { referralProgress } from "@/lib/referral-tiers";
import { loadReferralBoard } from "@/lib/referrals";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Member dashboard" };

function homeNotice(notice?: string) {
  if (notice === "welcome") return "Welcome in. Your membership is active.";
  if (notice === "role-assigned") return "You are signed up for the volunteer role you chose.";
  if (notice === "role-full") return "That volunteer role is full. Choose another open role below.";
  return null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; suggest?: string }>;
}) {
  const user = await requireMember();
  const { notice, suggest } = await searchParams;
  const db = getDb();
  const [profile] = await db.select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1);
  const [events, campaigns, opportunities, myApps, board] = await Promise.all([
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
    loadReferralBoard(),
  ]);

  const applied = new Set(myApps.map((row) => row.opportunityId));
  const suggested = new Set((suggest ?? "").split(",").filter(Boolean));
  const standing = board.find((row) => row.id === profile.id);
  const referralCount = standing?.referralCount ?? 0;
  const progress = referralProgress(referralCount);
  const nextEvent = events[0];
  const message = homeNotice(notice);
  const roleCount = myApps.length;

  return (
    <div>
      {message ? <DashboardNotice>{message}</DashboardNotice> : null}

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="mb-4">
        <h1 className="font-display text-xl text-brand sm:text-3xl">Welcome, {profile.fullName}</h1>
        <p className="mt-1 max-w-xl text-xs text-muted sm:mt-2 sm:text-sm">Your membership, referrals, and ways to take part.</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
          <Badge tone="sunshine">Active member</Badge>
          {progress.tier ? <Badge tone="brand">{progress.tier.name}</Badge> : null}
        </p>
      </header>

      {/* ── Stat cards — always 3-across ────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Link
          href="/dashboard/referrals"
          className="rounded-lg border border-brand/10 bg-paper p-2.5 transition hover:border-accent sm:rounded-xl sm:p-4"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-accent uppercase sm:text-[11px] sm:tracking-[0.16em]">Referrals</p>
          <p className="mt-1 font-display text-xl text-brand sm:mt-2 sm:text-3xl">{referralCount.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted sm:mt-1 sm:text-sm">
            {standing ? `#${standing.rank}` : "Pending"}
            <span className="hidden sm:inline">
              {progress.tier ? ` · ${progress.tier.name}` : " · No badge yet"}
            </span>
          </p>
        </Link>
        <Link
          href="/dashboard/leaderboard"
          className="rounded-lg border border-brand/10 bg-paper p-2.5 transition hover:border-accent sm:rounded-xl sm:p-4"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-accent uppercase sm:text-[11px] sm:tracking-[0.16em]">Next event</p>
          {nextEvent ? (
            <>
              <p className="mt-1 line-clamp-2 font-display text-sm text-brand sm:mt-2 sm:text-xl">{nextEvent.title}</p>
              <p className="mt-0.5 text-[10px] text-muted sm:mt-1 sm:text-sm">{formatDate(nextEvent.startsAt)}</p>
            </>
          ) : (
            <p className="mt-1 text-[10px] text-muted sm:mt-2 sm:text-sm">None yet</p>
          )}
        </Link>
        <div
          className="rounded-lg border border-brand/10 bg-paper p-2.5 sm:rounded-xl sm:p-4"
        >
          <p className="text-[10px] font-bold tracking-[0.14em] text-accent uppercase sm:text-[11px] sm:tracking-[0.16em]">Volunteering</p>
          <p className="mt-1 font-display text-xl text-brand sm:mt-2 sm:text-3xl">{roleCount.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted sm:mt-1 sm:text-sm">
            {roleCount === 1 ? "Role" : "Roles"}<span className="hidden sm:inline"> you&apos;re in</span>
          </p>
        </div>
      </div>

      {/* ── Get involved — events & campaigns ───────────────── */}
      <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-4 lg:grid-cols-2">
        <Card className="p-3 sm:p-6">
          <h2 className="font-display text-lg text-brand sm:text-xl">Upcoming events</h2>
          <ul className="mt-2 space-y-2 text-sm sm:mt-4 sm:space-y-3">
            {events.length ? (
              events.map((event) => (
                <li key={event.id}>
                  <a className="font-semibold text-brand underline" href={`/events/${event.slug}`}>
                    {event.title}
                  </a>
                  <span className="block text-muted sm:inline sm:before:mx-1.5 sm:before:content-['·']">
                    {formatDate(event.startsAt)}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-muted">No upcoming events yet.</li>
            )}
          </ul>
        </Card>
        <Card className="p-3 sm:p-6">
          <h2 className="font-display text-lg text-brand sm:text-xl">Active campaigns</h2>
          <ul className="mt-2 space-y-2 text-sm sm:mt-4 sm:space-y-3">
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
      </div>

      {/* ── Get involved — volunteer opportunities ──────────── */}
      <Card className="mt-3 p-3 sm:mt-4 sm:p-6">
        <h2 className="font-display text-lg text-brand sm:text-xl">Volunteer opportunities</h2>
        <ul className="mt-2 grid gap-2 sm:mt-4 sm:gap-3">
          {opportunities.map((role) => {
            const mine = applied.has(role.id);
            const highlight = suggested.has(role.slug);
            return (
              <li
                key={role.id}
                className={`rounded-lg border p-2.5 sm:p-4 ${highlight ? "border-accent bg-mist" : "border-brand/10"}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div>
                    <p className="text-sm font-semibold">{role.title}</p>
                    <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">{role.description}</p>
                    <p className="mt-1 text-[10px] text-accent sm:mt-2 sm:text-xs">
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
  );
}
