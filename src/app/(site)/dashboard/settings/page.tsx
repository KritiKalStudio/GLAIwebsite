import Link from "next/link";
import { eq } from "drizzle-orm";
import { logoutAction } from "@/app/actions/auth";
import { toggleDirectoryConsent } from "@/app/actions/ambassadors";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { DashboardHeading, DashboardNotice } from "@/components/dashboard/heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

function settingsNotice(notice?: string) {
  if (notice === "consent") return "Your directory preference has been updated.";
  return null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireMember();
  const { notice } = await searchParams;
  const [profile] = await getDb()
    .select({
      createdAt: ambassadors.createdAt,
      consentToDirectory: ambassadors.consentToDirectory,
      country: ambassadors.country,
    })
    .from(ambassadors)
    .where(eq(ambassadors.id, user.ambassadorId))
    .limit(1);

  const message = settingsNotice(notice);

  return (
    <div className="space-y-4">
      {message ? <DashboardNotice>{message}</DashboardNotice> : null}
      <DashboardHeading
        title="Settings"
        description="Account actions for this membership. Your name and place details live on your profile."
      />

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-0.5 font-semibold break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Member since</dt>
            <dd className="mt-0.5 font-semibold">{profile ? formatDate(profile.createdAt) : "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted">
          <Link className="font-semibold text-accent underline" href="/dashboard/profile">
            Edit your profile
          </Link>{" "}
          to change your name, contact details, or location.
        </p>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Password</h2>
        <p className="mt-2 mb-4 text-sm text-muted">
          You stay signed in on this device after the change.{" "}
          <Link className="font-semibold text-accent underline" href="/forgot-password">
            Forgot your current password?
          </Link>
        </p>
        <ChangePasswordForm />
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Network directory</h2>
        <p className="mt-2 text-sm text-muted">
          You are always counted in {profile?.country ?? "your country"}&apos;s total. Your name appears publicly only if you opt in.
        </p>
        <form action={toggleDirectoryConsent} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="consent" defaultChecked={profile?.consentToDirectory} />
            Show my name on the public network
          </label>
          <Button type="submit" size="sm" className="w-full sm:w-auto">
            Update consent
          </Button>
        </form>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Sign out</h2>
        <p className="mt-2 text-sm text-muted">End this session on this device.</p>
        <form action={logoutAction} className="mt-4">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}
