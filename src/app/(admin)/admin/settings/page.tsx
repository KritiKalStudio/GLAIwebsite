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
          hint="Activate a language here, then publish a CMS page with the same locale code. No code deploy is required."
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
        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
