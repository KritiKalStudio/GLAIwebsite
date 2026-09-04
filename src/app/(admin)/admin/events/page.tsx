import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { ButtonLink } from "@/components/ui/button";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function AdminEventsPage() {
  await requireAdmin("events");
  const rows = await getDb().select().from(events).orderBy(desc(events.startsAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Events</h1>
        <ButtonLink href="/admin/events/new">New event</ButtonLink>
      </div>
      <AdminTable headers={["Title", "When", "Status", ""]}>
        {rows.map((event) => (
          <tr key={event.id}>
            <td className="px-4 py-3">{event.title}</td>
            <td className="px-4 py-3">{formatDate(event.startsAt, "d MMM yyyy HH:mm")}</td>
            <td className="px-4 py-3">{event.status}</td>
            <td className="px-4 py-3">
              <Link className="text-accent" href={`/admin/events/${event.id}`}>
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
