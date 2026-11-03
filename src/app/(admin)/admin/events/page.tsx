import Link from "next/link";
import { sendDueReminders } from "@/app/actions/event-admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { listEventsForAdmin } from "@/lib/content/events";
import { requireAdmin } from "@/lib/admin";
import { eventDisplayTitle, registrationIsOpen } from "@/lib/events/portal";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ reminders?: string; reminderFailed?: string }>;
}) {
  await requireAdmin("events");
  const params = await searchParams;
  const rows = await listEventsForAdmin();
  const sent = Number(params.reminders ?? "");
  const failed = Number(params.reminderFailed ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Events</h1>
          <p className="mt-1 text-sm text-muted">Guest lists stay on these staff pages.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={sendDueReminders}>
            <Button type="submit" variant="outline">
              Send due reminders
            </Button>
          </form>
          <ButtonLink href="/admin/events/new">New event</ButtonLink>
        </div>
      </div>
      {Number.isFinite(sent) && params.reminders ? (
        <p className="rounded-md bg-hope/15 px-3 py-2 text-sm">
          {sent} reminder{sent === 1 ? "" : "s"} sent
          {failed ? ` · ${failed} failed` : ""}.
        </p>
      ) : null}
      <AdminTable headers={["Title", "When", "Registration", "Guests", "Status", ""]}>
        {rows.map((event) => (
          <tr key={event.id}>
            <td className="px-4 py-3">{eventDisplayTitle(event)}</td>
            <td className="px-4 py-3">{event.startsAt ? formatDate(event.startsAt, "d MMM yyyy HH:mm") : "Date to be announced"}</td>
            <td className="px-4 py-3">{registrationIsOpen(event) ? "Open" : "Closed"}</td>
            <td className="px-4 py-3">{event.registrationCount}</td>
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
