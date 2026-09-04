import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { completeTrainingModule, toggleDirectoryConsent, updateAmbassadorProfile } from "@/app/actions/ambassadors";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/card";
import { Section } from "@/components/blocks/section";
import { getDb } from "@/db";
import {
  ambassadorTrainingProgress,
  ambassadors,
  certificates,
  trainingModules,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { decryptField } from "@/lib/crypto";
import { getPublishedCampaigns } from "@/lib/content/donations";
import { getUpcomingEvents } from "@/lib/content/events";
import { getPublishedOpportunities } from "@/lib/content/volunteers";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ambassador dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.ambassadorId) {
    if (user.roleSlug) redirect("/admin");
    redirect("/login?pending=1");
  }
  if (user.ambassadorStatus !== "active" && user.ambassadorStatus !== "approved") {
    redirect("/login?pending=1");
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(ambassadors)
    .where(eq(ambassadors.id, user.ambassadorId))
    .limit(1);
  const [modules, progress, certs, events, campaigns, opportunities] = await Promise.all([
    db.select().from(trainingModules).orderBy(trainingModules.sortOrder),
    db
      .select()
      .from(ambassadorTrainingProgress)
      .where(eq(ambassadorTrainingProgress.ambassadorId, user.ambassadorId)),
    db.select().from(certificates).where(eq(certificates.ambassadorId, user.ambassadorId)),
    getUpcomingEvents(),
    getPublishedCampaigns(),
    getPublishedOpportunities(),
  ]);
  const done = new Set(progress.map((row) => row.moduleId));

  return (
    <Section className="surface-grid space-y-10 bg-canvas">
      <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-9 text-paper shadow-[0_24px_60px_rgba(16,42,67,.18)] sm:px-9">
        <div aria-hidden="true" className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-paper/15" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow text-sunshine">My Ambassador space</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Welcome, {profile.fullName}</h1><p className="mt-3 max-w-xl text-paper/75">Your personal centre for training, contribution, community opportunities and credentials.</p><p className="mt-5"><Badge tone="sunshine">{user.ambassadorStatus} Love Ambassador</Badge></p></div>
        <form action={logoutAction}>
          <Button variant="outline" className="border-paper/25 bg-transparent text-paper hover:bg-paper/10 hover:text-paper" type="submit">
            Sign out
          </Button>
        </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 p-5"><p className="eyebrow">Learning</p><p className="mt-2 font-display text-4xl text-brand">{done.size}<span className="text-xl text-muted">/{modules.length}</span></p><p className="mt-1 text-sm text-muted">modules completed</p></Card>
        <Card className="border-0 p-5"><p className="eyebrow">Recognition</p><p className="mt-2 font-display text-4xl text-brand">{certs.length}</p><p className="mt-1 text-sm text-muted">certificates earned</p></Card>
        <Card className="border-0 p-5"><p className="eyebrow">Network visibility</p><p className="mt-2 font-display text-2xl text-brand">{profile.consentToDirectory ? "Visible" : "Private"}</p><p className="mt-2 text-sm text-muted">Your choice, always.</p></Card>
      </div>

      <Card className="p-6 lg:p-8">
        <h2 className="font-display text-2xl">Profile</h2>
        <form action={updateAmbassadorProfile} className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Full name" name="fullName">
            <TextInput id="fullName" name="fullName" defaultValue={profile.fullName} />
          </Field>
          <Field label="Phone" name="phone">
            <TextInput id="phone" name="phone" defaultValue={decryptField(profile.phone) ?? ""} />
          </Field>
          <Field label="Region" name="region">
            <TextInput id="region" name="region" defaultValue={profile.region ?? ""} />
          </Field>
          <Field label="Profession" name="profession">
            <TextInput id="profession" name="profession" defaultValue={profile.profession ?? ""} />
          </Field>
          <Field label="My contributions" name="contributions" className="md:col-span-2">
            <TextArea id="contributions" name="contributions" defaultValue={profile.contributions ?? ""} />
          </Field>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>

      <Card className="p-6 lg:p-8">
        <h2 className="font-display text-2xl">Network directory consent</h2>
        <p className="mt-2 text-sm text-muted">
          You are always counted in {profile.country}&apos;s total. Your name appears publicly only if you opt in.
        </p>
        <form action={toggleDirectoryConsent} className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="consent"
              defaultChecked={profile.consentToDirectory}
            />
            Show my name on the public network
          </label>
          <Button type="submit" size="sm">
            Update consent
          </Button>
        </form>
      </Card>

      <Card className="p-6 lg:p-8">
        <h2 className="font-display text-2xl">Training</h2>
        <p className="mt-1 text-sm text-muted">
          {done.size}/{modules.length} modules completed
        </p>
        <ul className="mt-4 space-y-3">
          {modules.map((mod) => (
            <li key={mod.id} className="flex items-center justify-between gap-3 border-b border-brand/10 py-3">
              <div>
                <p className="font-semibold">{mod.title}</p>
                <p className="text-sm text-muted">{mod.description}</p>
              </div>
              {done.has(mod.id) ? (
                <Badge tone="hope">Done</Badge>
              ) : (
                <form action={completeTrainingModule}>
                  <input type="hidden" name="moduleId" value={mod.id} />
                  <Button size="sm" variant="outline">
                    Mark complete
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-2xl">Upcoming events</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id}>
                <a className="text-brand underline" href={`/events/${event.slug}`}>
                  {event.title}
                </a>
                <span className="text-muted"> · {formatDate(event.startsAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-2xl">Active campaigns</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <a className="text-brand underline" href="/donate">
                  {campaign.name}
                </a>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-2xl">Certificates</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {certs.length ? (
              certs.map((cert) => (
                <li key={cert.id}>
                  {cert.title} · {formatDate(cert.issuedAt)}
                </li>
              ))
            ) : (
              <li className="text-muted">None issued yet.</li>
            )}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-2xl">Volunteer opportunities</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {opportunities.map((role) => (
              <li key={role.id}>
                <a className="text-brand underline" href="/get-involved/volunteer">
                  {role.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}
