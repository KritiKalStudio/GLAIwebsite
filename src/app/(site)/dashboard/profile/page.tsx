import { eq } from "drizzle-orm";
import { updateAmbassadorProfile } from "@/app/actions/ambassadors";
import { DashboardHeading, DashboardNotice } from "@/components/dashboard/heading";
import { MembershipPlaceFields } from "@/components/forms/membership-place-fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { decryptField } from "@/lib/crypto";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

function profileNotice(notice?: string) {
  if (notice === "saved") return "Your profile has been saved.";
  return null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireMember();
  const { notice } = await searchParams;
  const [profile] = await getDb().select().from(ambassadors).where(eq(ambassadors.id, user.ambassadorId)).limit(1);
  const message = profileNotice(notice);

  return (
    <div className="space-y-4">
      {message ? <DashboardNotice>{message}</DashboardNotice> : null}
      <DashboardHeading
        title="Profile"
        description="These details identify you in the membership records. Public visibility is managed in Settings."
      />

      <Card className="p-4 sm:p-6">
        <h2 className="font-display text-xl text-brand">Your details</h2>
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
          <div className="grid gap-4 sm:col-span-2">
            <MembershipPlaceFields
              defaults={{
                nationality: profile.nationality ?? profile.country,
                country: profile.country,
                stateOfOrigin: profile.stateOfOrigin ?? "",
                localGovernment: profile.localGovernment ?? "",
                electoralWard: profile.electoralWard ?? "",
                pollingUnit: profile.pollingUnit ?? "",
                religion: profile.religion ?? "",
              }}
            />
          </div>
          <Field label="Tribe" name="tribe">
            <TextInput id="tribe" name="tribe" defaultValue={profile.tribe ?? ""} />
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
            <Button type="submit" className="w-full sm:w-auto">
              Save profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
