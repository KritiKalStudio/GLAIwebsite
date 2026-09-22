import { and, eq, inArray } from "drizzle-orm";
import { toggleVolunteerRole } from "@/app/actions/volunteers";
import { DashboardHeading, DashboardNotice } from "@/components/dashboard/heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDb } from "@/db";
import { volunteerApplications } from "@/db/schema";
import { getUpcomingEvents } from "@/lib/content/events";
import { getActivePrograms } from "@/lib/content/programs";
import { getPublishedOpportunitiesWithSlots } from "@/lib/content/volunteers";
import { formatDate } from "@/lib/format";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get involved" };

function involvedNotice(notice?: string) {
  if (notice === "role-assigned") return "You are signed up for the volunteer role you chose.";
  if (notice === "role-full") {
    return "That volunteer role is full. Other open roles are listed below — apply for one of those instead.";
  }
  return null;
}

export default async function GetInvolvedPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; suggest?: string }>;
}) {
  const user = await requireMember();
  const { notice, suggest } = await searchParams;
  const [events, campaigns, opportunities, myApps] = await Promise.all([
    getUpcomingEvents(),
    getActivePrograms(),
    getPublishedOpportunitiesWithSlots(),
    getDb()
      .select()
      .from(volunteerApplications)
      .where(
        and(
          eq(volunteerApplications.userId, user.id),
          inArray(volunteerApplications.status, ["accepted", "applied"]),
        ),
      ),
  ]);
  const applied = new Set(myApps.map((row) => row.opportunityId));
  const suggested = new Set((suggest ?? "").split(",").filter(Boolean));
  const message = involvedNotice(notice);

  return (
    <div className="space-y-4">
      {message ? <DashboardNotice>{message}</DashboardNotice> : null}
      <DashboardHeading
        title="Get involved"
        description="Upcoming events, campaigns that are running now, and volunteer roles you can take or leave."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <h2 className="font-display text-xl text-brand">Upcoming events</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {events.length ? (
              events.map((event) => (
                <li key={event.id}>
                  <a className="font-semibold text-brand underline" href={`/events/${event.slug}`}>
                    {event.title}
                  </a>
                  <span className="block text-muted sm:inline sm:before:mx-1.5 sm:before:content-['·']">
                    {formatDate(event.startsAt)}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-muted">No upcoming events yet.</li>
            )}
          </ul>
        </Card>
        <Card className="p-4 sm:p-6">
          <h2 className="font-display text-xl text-brand">Active campaigns</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {campaigns.length ? (
              campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <a className="font-semibold text-brand underline" href={`/our-work/${campaign.slug}`}>
                    {campaign.name}
                  </a>
                </li>
              ))
            ) : (
              <li className="text-muted">No campaigns are in their active period right now.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Volunteer opportunities</h2>
        <ul className="mt-4 grid gap-3">
          {opportunities.map((role) => {
            const mine = applied.has(role.id);
            const highlight = suggested.has(role.slug);
            return (
              <li
                key={role.id}
                className={`rounded-lg border p-3 sm:p-4 ${highlight ? "border-accent bg-mist" : "border-brand/10"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{role.title}</p>
                    <p className="mt-1 text-sm text-muted">{role.description}</p>
                    <p className="mt-2 text-xs text-accent">
                      {role.remaining} of {role.slots} slots open
                      {role.location ? ` · ${role.location}` : ""}
                    </p>
                  </div>
                  <form action={toggleVolunteerRole} className="sm:shrink-0">
                    <input type="hidden" name="opportunityId" value={role.id} />
                    <input type="hidden" name="intent" value={mine ? "unapply" : "apply"} />
                    <Button
                      type="submit"
                      size="sm"
                      variant={mine ? "outline" : "primary"}
                      className="w-full sm:w-auto"
                      disabled={!mine && role.remaining <= 0}
                    >
                      {mine ? "Un-apply" : role.remaining <= 0 ? "Full" : "Apply"}
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
          {opportunities.length === 0 ? <li className="text-sm text-muted">No published roles right now.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
