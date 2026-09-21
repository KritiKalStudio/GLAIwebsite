import { redirect } from "next/navigation";
import { Section } from "@/components/blocks/section";
import { ReferralLeaderboard } from "@/components/referrals/leaderboard-table";
import { MemberDashboardNav } from "@/components/referrals/member-nav";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { tierForCount } from "@/lib/referral-tiers";
import { ensureReferralCode, loadReferralBoard } from "@/lib/referrals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referral leaderboard", robots: { index: false, follow: false } };

export default async function ReferralLeaderboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/leaderboard");
  if (!user.ambassadorId) {
    if (user.roleSlug) redirect("/admin");
    redirect("/signup");
  }

  await ensureReferralCode(user.ambassadorId);
  const board = await loadReferralBoard();
  const mine = board.find((row) => row.id === user.ambassadorId);
  const honour = tierForCount(mine?.referralCount ?? 0);

  return (
    <Section className="space-y-6 bg-canvas px-4 sm:space-y-10">
      <MemberDashboardNav current="leaderboard" />
      <header>
        <p className="eyebrow">Member dashboard</p>
        <h1 className="mt-2 font-display text-2xl sm:text-5xl">Referral leaderboard</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
          Every registered member, ranked by people who finished signup with their code. When two members have the same
          number, the one who reached it first ranks higher.
        </p>
      </header>
      <Card className="p-4 sm:p-6">
        <p className="text-sm text-muted">Your rank</p>
        <p className="mt-1 font-display text-2xl sm:text-3xl">
          {mine ? `#${mine.rank}` : "—"}
          <span className="ml-3 font-sans text-base font-semibold text-ink">
            {(mine?.referralCount ?? 0).toLocaleString()} {(mine?.referralCount ?? 0) === 1 ? "referral" : "referrals"}
          </span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {honour ? `${honour.name} is your current honour.` : "Refer one person to unlock Starter."}
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
    </Section>
  );
}
