import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminTable } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("events");
  const { id } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();
  const attendees = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, id))
    .orderBy(desc(eventRegistrations.createdAt));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Edit event</h1>
        <EventForm event={event} />
      </div>
      <section>
        <h2 className="font-display text-2xl">People who registered</h2>
        <p className="mt-1 mb-4 text-sm text-muted">{attendees.length} registrations</p>
        <AdminTable headers={["Name", "Email", "Status", "Registered"]}>
          {attendees.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">{row.email}</td>
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3">{formatDate(row.createdAt, "d MMM yyyy")}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
