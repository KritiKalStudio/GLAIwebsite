"use client";

import { TierMedal } from "@/components/referrals/tier-medal";
import { PaginatedTable } from "@/components/ui/paginated-table";
import { tierBySlug } from "@/lib/referral-tiers";

export type PublicLeaderboardRow = {
  rank: number;
  id: string;
  fullName: string;
  country: string;
  referralCount: number;
  tierSlug: string | null;
  isYou: boolean;
};

export function ReferralLeaderboard({ rows }: { rows: PublicLeaderboardRow[] }) {
  return (
    <PaginatedTable
      rows={rows}
      rowKey={(row) => row.id}
      pageSize={20}
      summaryNoun="members"
      filterPlaceholder="Search members"
      empty="No registered members to rank yet."
      matches={(row, query) => row.fullName.toLowerCase().includes(query) || row.country.toLowerCase().includes(query)}
      columns={[
        {
          header: "Rank",
          className: "w-16",
          cell: (row) => <span className="font-semibold tabular-nums">{row.rank}</span>,
        },
        {
          header: "Member",
          cell: (row) => (
            <span>
              {row.fullName}
              {row.isYou ? (
                <span className="ml-2 rounded-full bg-sunshine/40 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                  You
                </span>
              ) : null}
            </span>
          ),
        },
        { header: "Country", cell: (row) => row.country },
        {
          header: "Referrals",
          cell: (row) => <span className="tabular-nums">{row.referralCount.toLocaleString()}</span>,
        },
        {
          header: "Honour",
          cell: (row) => {
            const tier = tierBySlug(row.tierSlug);
            if (!tier) return <span className="text-muted">—</span>;
            return (
              <span className="inline-flex items-center gap-2">
                <TierMedal tier={tier} state={row.isYou ? "current" : "earned"} size="sm" />
                <span className="font-semibold">{tier.name}</span>
              </span>
            );
          },
        },
      ]}
    />
  );
}
