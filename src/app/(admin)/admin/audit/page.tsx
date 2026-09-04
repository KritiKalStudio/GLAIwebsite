import { desc, eq } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { getDb } from "@/db";
import { auditLog, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity log" };

export default async function AdminAuditPage() {
  await requireAdmin("users");
  const rows = await getDb()
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt,
      actorName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Activity log</h1>
        <p className="mt-2 text-sm text-muted">Who changed what, and when. Latest 200 entries.</p>
      </div>
      <AdminTable headers={["When", "Who", "Action", "Record"]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">{formatDate(row.createdAt, "d MMM yyyy HH:mm")}</td>
            <td className="px-4 py-3">{row.actorName ?? "System"}</td>
            <td className="px-4 py-3">{row.action}</td>
            <td className="px-4 py-3 text-muted">
              {row.entityType}
              {row.entityId ? ` · ${row.entityId}` : ""}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
