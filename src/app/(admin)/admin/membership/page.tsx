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
  const pending = rows.filter((row) => row.status === "applied");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Membership</h1>
        <p className="mt-2 text-sm text-muted">
          Review applications, then approve to create a member account or decline with notes.
        </p>
      </div>
      <section>
        <h2 className="font-display text-xl">Waiting for review ({pending.length})</h2>
        <div className="mt-3">
          <AdminTable headers={["Name", "Country", "Applied", ""]}>
            {pending.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.fullName}</td>
                <td className="px-4 py-3">{row.country}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link className="text-accent" href={`/admin/membership/${row.id}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">All ambassadors</h2>
        <div className="mt-3">
          <AdminTable headers={["Name", "Email", "Status", "Directory", ""]}>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.fullName}</td>
                <td className="px-4 py-3">{row.email}</td>
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
      </section>
    </div>
  );
}
