import Link from "next/link";
import { eq } from "drizzle-orm";
import { DashboardHeading } from "@/components/dashboard/heading";
import { ReferralShare } from "@/components/referrals/referral-share";
import { TierMedal } from "@/components/referrals/tier-medal";
import { Card } from "@/components/ui/card";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { getRequestSiteUrl } from "@/lib/env";
import { REFERRAL_TIERS, referralProgress, referralSignupPath } from "@/lib/referral-tiers";
import { ensureReferralCode, loadReferralBoard } from "@/lib/referrals";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const user = await requireMember();
  const [profile] = await getDb().select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1);
  const referralCode = profile.referralCode ?? (await ensureReferralCode(profile.id));
  const board = await loadReferralBoard();
  const standing = board.find((row) => row.id === profile.id);
  const referralCount = standing?.referralCount ?? 0;
  const progress = referralProgress(referralCount);
  const referralLink = referralCode ? `${await getRequestSiteUrl()}${referralSignupPath(referralCode)}` : "";
  const preview = board.slice(0, 5);

  return (
    <div className="space-y-4">
      <DashboardHeading
        title="Referrals"
        description="Share your code or link. When someone finishes registration with it, they count toward your badge rank."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="p-4 sm:p-6">
          <h2 className="font-display text-xl text-brand">Your referral link</h2>
          {referralCode ? (
            <ReferralShare code={referralCode} link={referralLink} />
          ) : (
            <p className="mt-4 text-sm text-muted">Your code is being prepared. Refresh this page in a moment.</p>
          )}
        </Card>
        <Card className="p-4 sm:p-6">
          <h2 className="font-display text-xl text-brand">
            {referralCount.toLocaleString()} {referralCount === 1 ? "referral" : "referrals"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {standing ? `You are ranked #${standing.rank} of ${board.length}.` : "Your rank will appear once your membership is counted."}{" "}
            <Link className="font-semibold text-accent underline" href="/dashboard/leaderboard">
              Open the leaderboard
            </Link>
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

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Referral badges</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Eight badges. Each one asks for more new members than the last, from a single signup to 1,500.
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
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

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl text-brand">Top of the board</h2>
            <p className="mt-1 text-sm text-muted">Ties go to whoever reached that number first.</p>
          </div>
          <Link className="text-sm font-semibold text-accent underline" href="/dashboard/leaderboard">
            Full ranking
          </Link>
        </div>
        <ol className="mt-3 divide-y divide-brand/10">
          {preview.length ? (
            preview.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="mr-2 font-semibold tabular-nums text-muted">#{row.rank}</span>
                  <span className="font-semibold">{row.fullName}</span>
                  {row.id === profile.id ? (
                    <span className="ml-2 text-xs font-semibold tracking-wide text-accent uppercase">You</span>
                  ) : null}
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
    </div>
  );
}
