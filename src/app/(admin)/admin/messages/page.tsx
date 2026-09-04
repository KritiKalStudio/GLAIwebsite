import { desc } from "drizzle-orm";
import { markMessageRead } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  await requireAdmin("content");
  const rows = await getDb().select().from(contactMessages).orderBy(desc(contactMessages.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Messages</h1>
        <p className="mt-2 text-sm text-muted">Contact form submissions from the public site.</p>
      </div>
      <AdminTable headers={["From", "Topic", "Status", "When", ""]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">
              {row.name}
              <span className="block text-xs text-muted">{row.email}</span>
            </td>
            <td className="px-4 py-3">
              {row.topic}
              <p className="mt-1 max-w-md text-xs text-muted">{row.body}</p>
            </td>
            <td className="px-4 py-3">{row.status}</td>
            <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
            <td className="px-4 py-3">
              {row.status === "unread" ? (
                <form action={markMessageRead}>
                  <input type="hidden" name="id" value={row.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Mark read
                  </Button>
                </form>
              ) : null}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
