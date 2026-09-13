import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membership" };

export default async function AdminMembershipPage() {
  await requireAdmin("membership");
  const rows = await getDb().select().from(ambassadors).orderBy(desc(ambassadors.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Membership</h1>
        <p className="mt-2 text-sm text-muted">
          Directory of members. Sign-up is confirmed by WhatsApp — there is no application review.
        </p>
      </div>
      <AdminTable headers={["Name", "Email", "Nationality", "Status", "Directory", ""]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">{row.fullName}</td>
            <td className="px-4 py-3">{row.email}</td>
            <td className="px-4 py-3">{row.nationality || row.country}</td>
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
    </div>
  );
}
