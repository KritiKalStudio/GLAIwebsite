import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { markEventAttendance, sendDueReminders, sendEventInvites } from "@/app/actions/event-admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { CopyLink } from "@/components/admin/copy-link";
import { EventForm } from "@/components/admin/event-form";
import { Button } from "@/components/ui/button";
import { Field, TextArea } from "@/components/ui/field";
import { getDb } from "@/db";
import { eventRegistrations, events } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";
import { decryptField } from "@/lib/crypto";
import { getRequestSiteUrl } from "@/lib/env";
import { absoluteUrl, answersSummary, ensureRsvpToken, eventDisplayTitle, registrationIsOpen, rsvpLabel, rsvpPath } from "@/lib/events/portal";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    invited?: string;
    inviteFailed?: string;
    inviteError?: string;
    inviteTruncated?: string;
    attendance?: string;
    reminders?: string;
    reminderFailed?: string;
  }>;
}) {
  await requireAdmin("events");
  const { id } = await params;
  const notice = await searchParams;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();
  const token = await ensureRsvpToken(event.id, event.rsvpToken);
  const [attendees, media, origin] = await Promise.all([
    db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, id))
      .orderBy(desc(eventRegistrations.createdAt)),
    listMediaLibrary(),
    getRequestSiteUrl(),
  ]);
  const rsvpUrl = absoluteUrl(origin, rsvpPath(token));
  const publicUrl = event.status === "published" ? absoluteUrl(origin, `/events/${event.slug}`) : null;
  const invited = Number(notice.invited ?? "");
  const inviteFailed = Number(notice.inviteFailed ?? "");
  const reminders = Number(notice.reminders ?? "");
  const reminderFailed = Number(notice.reminderFailed ?? "");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Edit event</h1>
        <p className="mt-2 text-sm text-muted">
          Registration is {registrationIsOpen(event) ? "open" : "closed"}. Guest details on
          this page are visible only to staff with the Events permission.
        </p>
        {notice.attendance === "saved" ? (
          <p className="mt-3 rounded-md bg-hope/15 px-3 py-2 text-sm">Attendance updated.</p>
        ) : null}
        {notice.reminders ? (
          <p className="mt-3 rounded-md bg-hope/15 px-3 py-2 text-sm">
            {reminders} reminder{reminders === 1 ? "" : "s"} sent
            {reminderFailed ? ` · ${reminderFailed} failed` : ""}.
          </p>
        ) : null}
        <EventForm event={event} media={media} />
      </div>

      <section className="max-w-3xl space-y-4">
        <h2 className="font-display text-2xl">RSVP link</h2>
        <p className="text-sm text-muted">
          Share this link with guests. They can read the event and confirm whether they will attend. The same email
          address updates an earlier response.
        </p>
        <CopyLink url={rsvpUrl} />
        {publicUrl ? (
          <p className="text-sm">
            Published page:{" "}
            <a className="text-accent" href={publicUrl}>
              {publicUrl}
            </a>
          </p>
        ) : (
          <p className="text-sm text-muted">This event is not on the public events list until its status is Published. The RSVP link still works.</p>
        )}
        {notice.inviteError === "none" ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">Enter at least one valid email address.</p>
        ) : null}
        {notice.invited ? (
          <p className="rounded-md bg-hope/15 px-3 py-2 text-sm">
            {invited} invitation{invited === 1 ? "" : "s"} sent
            {inviteFailed ? ` · ${inviteFailed} failed` : ""}
            {notice.inviteTruncated ? " · only the first 50 addresses were used" : ""}.
          </p>
        ) : null}
        <form action={sendEventInvites} className="grid gap-3">
          <input type="hidden" name="eventId" value={event.id} />
          <Field label="Email the RSVP link" name="emails" hint="One address per line, or separate them with commas. Up to 50 at a time.">
            <TextArea id="emails" name="emails" className="min-h-28" placeholder="guest@example.org" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Send invitations</Button>
          </div>
        </form>
        <form action={sendDueReminders}>
          <input type="hidden" name="eventId" value={event.id} />
          <Button type="submit" variant="outline">
            Send due reminders
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-2xl">Registrations</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          {attendees.length} response{attendees.length === 1 ? "" : "s"} for {eventDisplayTitle(event)}.
        </p>
        <AdminTable headers={["Guest", "Response", "Answers", "Status", "When", ""]}>
          {attendees.map((row) => {
            const phone = decryptField(row.phone);
            return (
              <tr key={row.id}>
                <td className="px-4 py-3 align-top">
                  <p>{row.name}</p>
                  <p className="text-muted">{row.email}</p>
                  {phone ? <p className="text-muted">{phone}</p> : null}
                </td>
                <td className="px-4 py-3 align-top">{rsvpLabel(row.rsvpResponse)}</td>
                <td className="px-4 py-3 align-top whitespace-pre-line text-muted">
                  {answersSummary(event.customFields ?? [], row.answers ?? {}) || "—"}
                </td>
                <td className="px-4 py-3 align-top">{row.status}</td>
                <td className="px-4 py-3 align-top">{formatDate(row.createdAt, "d MMM yyyy")}</td>
                <td className="px-4 py-3 align-top">
                  {row.status === "attended" ? (
                    "Attended"
                  ) : (
                    <form action={markEventAttendance}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Mark attended
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
