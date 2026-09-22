import { ReferralLeaderboard } from "@/components/referrals/leaderboard-table";
import { DashboardHeading } from "@/components/dashboard/heading";
import { Card } from "@/components/ui/card";
import { tierForCount } from "@/lib/referral-tiers";
import { ensureReferralCode, loadReferralBoard } from "@/lib/referrals";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referral leaderboard", robots: { index: false, follow: false } };

export default async function ReferralLeaderboardPage() {
  const user = await requireMember();

  await ensureReferralCode(user.ambassadorId);
  const board = await loadReferralBoard();
  const mine = board.find((row) => row.id === user.ambassadorId);
  const honour = tierForCount(mine?.referralCount ?? 0);

  return (
    <div className="space-y-4">
      <DashboardHeading
        title="Referral leaderboard"
        description="Every registered member, ranked by people who finished signup with their code. When two members have the same number, the one who reached it first ranks higher."
      />
      <Card className="p-4 sm:p-6">
        <p className="text-sm text-muted">Your rank</p>
        <p className="mt-1 font-display text-2xl sm:text-3xl">
          {mine ? `#${mine.rank}` : "—"}
          <span className="ml-3 font-sans text-base font-semibold text-ink">
            {(mine?.referralCount ?? 0).toLocaleString()} {(mine?.referralCount ?? 0) === 1 ? "referral" : "referrals"}
          </span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {honour ? `${honour.name} is your current badge.` : "Refer one person to unlock Starter."}
          {mine ? ` ${board.length.toLocaleString()} members are ranked.` : ""}
        </p>
      </Card>
      <ReferralLeaderboard
        rows={board.map((row) => ({
          rank: row.rank,
          id: row.id,
          fullName: row.fullName,
          country: row.country,
          referralCount: row.referralCount,
          tierSlug: row.tier?.slug ?? null,
          isYou: row.id === user.ambassadorId,
        }))}
      />
    </div>
  );
}
