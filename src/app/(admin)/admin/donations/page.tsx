import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { donations, programs } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { isCampaignActive } from "@/lib/content/programs";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Donations" };

export default async function AdminDonationsPage() {
  await requireAdmin("donations");
  const db = getDb();
  const [programRows, giftRows] = await Promise.all([
    db.select().from(programs).orderBy(desc(programs.updatedAt)),
    db.select().from(donations).orderBy(desc(donations.createdAt)).limit(100),
  ]);
  const programName = new Map(programRows.map((row) => [row.id, row.name]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Donations</h1>
        <p className="mt-2 text-sm text-muted">
          Campaigns are programs. Add or remove them on Programs. Gifts below are recorded from the sandbox or a live
          processor.
        </p>
      </div>
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl">Campaigns</h2>
          <Link className="text-sm font-semibold text-accent" href="/admin/programs">
            Manage on Programs
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <AdminTable headers={["Name", "Period", "Goal", "Campaign"]}>
            {programRows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link className="text-accent" href={`/admin/programs/${row.id}`}>
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {row.startsAt || row.endsAt
                    ? `${formatDate(row.startsAt, "d MMM yyyy")} – ${formatDate(row.endsAt, "d MMM yyyy") || "open"}`
                    : "Open-ended"}
                </td>
                <td className="px-4 py-3">
                  {row.goalAmount ? formatMoney(row.goalAmount, row.currency) : "—"}
                </td>
                <td className="px-4 py-3">{isCampaignActive(row) ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Recent gifts</h2>
        <div className="mt-3 overflow-x-auto">
          <AdminTable headers={["Donor", "Program", "Amount", "Method", "Status", "When"]}>
            {giftRows.map((gift) => {
              const anonymous = gift.isAnonymous === "true";
              const member = gift.isMember === "true";
              const donorLabel = anonymous
                ? "Anonymous"
                : member
                  ? "Active member"
                  : gift.donorName || "Visitor";
              return (
                <tr key={gift.id}>
                  <td className="px-4 py-3">
                    {donorLabel}
                    {gift.donorOrganization && !anonymous ? (
                      <span className="block text-xs text-muted">{gift.donorOrganization}</span>
                    ) : null}
                    {!anonymous && gift.donorEmail ? (
                      <span className="block text-xs text-muted">{gift.donorEmail}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {gift.programId ? (programName.get(gift.programId) ?? "Program") : "General"}
                  </td>
                  <td className="px-4 py-3">{formatMoney(gift.amount, gift.currency)}</td>
                  <td className="px-4 py-3">{gift.processor.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{gift.status}</td>
                  <td className="px-4 py-3">{formatDate(gift.createdAt, "d MMM yyyy")}</td>
                </tr>
              );
            })}
          </AdminTable>
        </div>
      </section>
    </div>
  );
}
