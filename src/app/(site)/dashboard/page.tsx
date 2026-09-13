import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { toggleDirectoryConsent, updateAmbassadorProfile } from "@/app/actions/ambassadors";
import { logoutAction } from "@/app/actions/auth";
import { toggleVolunteerRole } from "@/app/actions/volunteers";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/card";
import { Section } from "@/components/blocks/section";
import { getDb } from "@/db";
import { ambassadors, volunteerApplications } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { decryptField } from "@/lib/crypto";
import { getActivePrograms } from "@/lib/content/programs";
import { getUpcomingEvents } from "@/lib/content/events";
import { getPublishedOpportunitiesWithSlots } from "@/lib/content/volunteers";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Member dashboard", robots: { index: false, follow: false } };

function noticeCopy(notice?: string) {
  if (notice === "welcome") return "Welcome in. Your membership is active.";
  if (notice === "role-assigned") return "You are signed up for the volunteer role you chose.";
  if (notice === "role-full") {
    return "That volunteer role is full. Other open roles are listed below — apply for one of those instead.";
  }
  return null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; suggest?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.ambassadorId) {
    if (user.roleSlug) redirect("/admin");
    redirect("/signup");
  }

  const { notice, suggest } = await searchParams;
  const db = getDb();
  const [profile] = await db.select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1);
  const [events, campaigns, opportunities, myApps] = await Promise.all([
    getUpcomingEvents(),
    getActivePrograms(),
    getPublishedOpportunitiesWithSlots(),
    db
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
  const message = noticeCopy(notice);

  return (
    <Section className="space-y-10 bg-canvas px-4 sm:space-y-12">
      {message ? (
        <p className="rounded-xl bg-hope/20 px-4 py-3 text-sm font-medium text-ink" role="status">
          {message}
        </p>
      ) : null}
      <div className="relative overflow-hidden rounded-2xl bg-brand px-5 py-8 text-paper shadow-[0_24px_60px_rgba(16,42,67,.18)] sm:px-9 sm:py-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow text-sunshine">My space</p>
            <h1 className="mt-3 font-display text-3xl sm:text-5xl">Welcome, {profile.fullName}</h1>
            <p className="mt-3 max-w-xl text-paper/75">Events, active campaigns, and volunteer roles — all in one place.</p>
            <p className="mt-5">
              <Badge tone="sunshine">Active member</Badge>
            </p>
          </div>
          <form action={logoutAction}>
            <Button
              variant="outline"
              className="min-h-11 w-full border-paper/25 bg-transparent text-paper hover:bg-paper/10 hover:text-paper sm:w-auto"
              type="submit"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <Card className="p-5 sm:p-8">
        <h2 className="font-display text-2xl">Profile</h2>
        <form action={updateAmbassadorProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName">
            <TextInput id="fullName" name="fullName" defaultValue={profile.fullName} />
          </Field>
          <Field label="WhatsApp number" name="whatsapp">
            <TextInput id="whatsapp" name="whatsapp" defaultValue={decryptField(profile.whatsapp ?? profile.phone) ?? ""} />
          </Field>
          <Field label="Age" name="age">
            <TextInput id="age" name="age" type="number" defaultValue={profile.age ?? ""} />
          </Field>
          <Field label="State of origin" name="stateOfOrigin">
            <TextInput id="stateOfOrigin" name="stateOfOrigin" defaultValue={profile.stateOfOrigin ?? ""} />
          </Field>
          <Field label="Local government" name="localGovernment">
            <TextInput id="localGovernment" name="localGovernment" defaultValue={profile.localGovernment ?? ""} />
          </Field>
          <Field label="Nationality" name="nationality">
            <TextInput id="nationality" name="nationality" defaultValue={profile.nationality ?? profile.country} />
          </Field>
          <Field label="Tribe" name="tribe">
            <TextInput id="tribe" name="tribe" defaultValue={profile.tribe ?? ""} />
          </Field>
          <Field label="Religion" name="religion">
            <TextInput id="religion" name="religion" defaultValue={profile.religion ?? ""} />
          </Field>
          <Field label="Education" name="education">
            <TextInput id="education" name="education" defaultValue={profile.education ?? ""} />
          </Field>
          <Field label="Occupation" name="occupation">
            <TextInput id="occupation" name="occupation" defaultValue={profile.occupation ?? profile.profession ?? ""} />
          </Field>
          <Field label="Organization" name="organization">
            <TextInput id="organization" name="organization" defaultValue={profile.organization ?? ""} />
          </Field>
          <Field label="Current address" name="currentAddress" className="sm:col-span-2">
            <TextArea id="currentAddress" name="currentAddress" defaultValue={profile.currentAddress ?? ""} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" className="min-h-11 w-full sm:w-auto">
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5 sm:p-8">
        <h2 className="font-display text-2xl">Network directory consent</h2>
        <p className="mt-2 text-sm text-muted">
          You are always counted in {profile.country}&apos;s total. Your name appears publicly only if you opt in.
        </p>
        <form action={toggleDirectoryConsent} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="consent" defaultChecked={profile.consentToDirectory} />
            Show my name on the public network
          </label>
          <Button type="submit" size="sm" className="min-h-11 w-full sm:w-auto">
            Update consent
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-2xl">Upcoming events</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {events.length ? (
              events.map((event) => (
                <li key={event.id}>
                  <a className="font-semibold text-brand underline" href={`/events/${event.slug}`}>
                    {event.title}
                  </a>
                  <span className="block text-muted sm:inline sm:before:content-['·_']">{formatDate(event.startsAt)}</span>
                </li>
              ))
            ) : (
              <li className="text-muted">No upcoming events yet.</li>
            )}
          </ul>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-2xl">Active campaigns</h2>
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
        <Card className="p-5 sm:p-6 sm:col-span-2">
          <h2 className="font-display text-2xl">Volunteer opportunities</h2>
          <ul className="mt-4 grid gap-4">
            {opportunities.map((role) => {
              const mine = applied.has(role.id);
              const highlight = suggested.has(role.slug);
              return (
                <li
                  key={role.id}
                  className={`rounded-xl border p-4 ${highlight ? "border-accent bg-mist" : "border-brand/10"}`}
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
                        className="min-h-11 w-full sm:w-auto"
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
    </Section>
  );
}
