import Link from "next/link";
import { MembershipFilters } from "@/components/admin/membership-filters";
import { AdminTable } from "@/components/admin/admin-shell";
import {
  listFilteredMembers,
  listMembershipFilterOptions,
  membershipBreakdown,
  parseMembershipPlaceFilter,
} from "@/lib/admin/membership-place";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membership" };

export default async function AdminMembershipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("membership");
  const search = await searchParams;
  const filter = parseMembershipPlaceFilter(search);
  const [options, breakdown, rows] = await Promise.all([
    listMembershipFilterOptions(filter),
    membershipBreakdown(filter),
    listFilteredMembers(filter),
  ]);
  const nigerian = filter.countryCode === "NG";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Membership</h1>
        <p className="mt-2 text-sm text-muted">
          Directory of members. Filter by country and, for Nigeria, by geo-political zone, state, LGA, ward, and
          polling unit.
        </p>
      </div>
      <MembershipFilters filter={filter} options={options} />
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl">{breakdown.label}</h2>
          <p className="text-sm text-muted">{rows.length} member{rows.length === 1 ? "" : "s"} in this view</p>
        </div>
        {breakdown.rows.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {breakdown.rows.map((row) => (
              <li key={row.href + row.name}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between rounded-md border border-brand/10 bg-paper px-3 py-2 text-sm hover:border-accent"
                >
                  <span>{row.name}</span>
                  <span className="tabular-nums text-muted">{row.total}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No further place counts at this level.</p>
        )}
      </section>
      <AdminTable
        headers={
          nigerian
            ? ["Name", "Email", "State", "LGA", "Status", "Directory", ""]
            : ["Name", "Email", "Nationality", "Status", "Directory", ""]
        }
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">{row.fullName}</td>
            <td className="px-4 py-3">{row.email}</td>
            {nigerian ? (
              <>
                <td className="px-4 py-3">{row.stateOfOrigin || "—"}</td>
                <td className="px-4 py-3">{row.localGovernment || "—"}</td>
              </>
            ) : (
              <td className="px-4 py-3">{row.nationality || row.country}</td>
            )}
            <td className="px-4 py-3">{row.status}</td>
            <td className="px-4 py-3">{row.consentToDirectory ? "Visible" : "Counted only"}</td>
            <td className="px-4 py-3">
              <Link className="text-accent" href={`/admin/membership/${row.id}`}>
                Open
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
      <p className="text-xs text-muted">Joined dates are on each member record. First listed {rows[0] ? formatDate(rows[0].createdAt) : "—"}.</p>
    </div>
  );
}
