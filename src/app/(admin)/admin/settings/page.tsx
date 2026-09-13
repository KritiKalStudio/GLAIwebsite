import { eq } from "drizzle-orm";
import { saveSettings } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site settings" };

export default async function AdminSettingsPage() {
  await requireAdmin("settings");
  const [settings] = await getDb()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Site settings</h1>
        <p className="mt-2 text-sm text-muted">
          Navigation, footer, contact, and search wording. Use valid JSON in the structured fields.
        </p>
      </div>
      <form action={saveSettings} className="grid gap-4">
        <Field label="Organisation name" name="orgName">
          <TextInput id="orgName" name="orgName" defaultValue={settings?.orgName} required />
        </Field>
        <Field label="Tagline" name="tagline">
          <TextInput id="tagline" name="tagline" defaultValue={settings?.tagline} required />
        </Field>
        <Field
          label="Languages (JSON)"
          name="languages"
          hint="Active languages appear in the header switcher. Stories and programs can be stored per language code."
        >
          <TextArea
            id="languages"
            name="languages"
            className="min-h-32 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.languages ?? [], null, 2)}
          />
        </Field>
        <Field label="Navigation (JSON)" name="navigation">
          <TextArea
            id="navigation"
            name="navigation"
            className="min-h-48 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.navigation ?? [], null, 2)}
          />
        </Field>
        <Field label="Header buttons (JSON)" name="headerCtas">
          <TextArea
            id="headerCtas"
            name="headerCtas"
            className="min-h-32 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.headerCtas ?? {}, null, 2)}
          />
        </Field>
        <Field label="Footer (JSON)" name="footer">
          <TextArea
            id="footer"
            name="footer"
            className="min-h-48 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.footer ?? {}, null, 2)}
          />
        </Field>
        <Field label="Contact (JSON)" name="contact">
          <TextArea
            id="contact"
            name="contact"
            className="min-h-32 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.contact ?? {}, null, 2)}
          />
        </Field>
        <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-brand/10 bg-paper p-5">
          <legend className="px-1 text-sm font-semibold">Bank transfer details</legend>
          <p className="text-sm text-muted">Shown on program Donate now forms when a visitor chooses bank transfer.</p>
          <Field label="Bank name" name="bankName">
            <TextInput id="bankName" name="bankName" defaultValue={settings?.payment?.bank?.bankName ?? ""} />
          </Field>
          <Field label="Account name" name="bankAccountName">
            <TextInput
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={settings?.payment?.bank?.accountName ?? ""}
            />
          </Field>
          <Field label="Account number" name="bankAccountNumber">
            <TextInput
              id="bankAccountNumber"
              name="bankAccountNumber"
              defaultValue={settings?.payment?.bank?.accountNumber ?? ""}
            />
          </Field>
          <Field label="Instructions" name="bankInstructions">
            <TextArea
              id="bankInstructions"
              name="bankInstructions"
              defaultValue={settings?.payment?.bank?.instructions ?? ""}
            />
          </Field>
        </fieldset>
        <Field label="Default search wording (JSON)" name="defaultSeo">
          <TextArea
            id="defaultSeo"
            name="defaultSeo"
            className="min-h-24 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.defaultSeo ?? {}, null, 2)}
          />
        </Field>
        <Field label="Design tokens (JSON)" name="designTokens">
          <TextArea
            id="designTokens"
            name="designTokens"
            className="min-h-24 font-mono text-xs"
            defaultValue={JSON.stringify(settings?.designTokens ?? {}, null, 2)}
          />
        </Field>
        <Button type="submit" className="min-h-11 w-full sm:w-auto">
          Save settings
        </Button>
      </form>
    </div>
  );
}
