import { eq } from "drizzle-orm";
import { saveSettings } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { mergeMailSettings } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site settings" };

export default async function AdminSettingsPage() {
  await requireAdmin("settings");
  const [settings] = await getDb()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);
  const mail = mergeMailSettings(settings?.payment?.mail);
  const smtpSaved = Boolean(mail.googleSmtp.passwordEncrypted);
  const resendKeySaved = Boolean(mail.resend.apiKeyEncrypted);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Site settings</h1>
        <p className="mt-2 text-sm text-muted">
          Navigation, footer, contact, email delivery, and bank details. Use valid JSON in the structured fields.
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
          <legend className="px-1 text-sm font-semibold">Email delivery</legend>
          <p className="text-sm text-muted">
            Use Google SMTP until a custom domain is verified on Resend. Switching providers here does not require a
            code change.
          </p>
          <Field label="Active provider" name="mailProvider">
            <Select id="mailProvider" name="mailProvider" defaultValue={mail.provider}>
              <option value="google_smtp">Google SMTP</option>
              <option value="resend">Resend</option>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gmail address" name="smtpUser" hint="The Google account that owns the app password">
              <TextInput
                id="smtpUser"
                name="smtpUser"
                type="email"
                autoComplete="off"
                defaultValue={mail.googleSmtp.user}
                placeholder="you@gmail.com"
              />
            </Field>
            <Field
              label="Gmail app password"
              name="smtpPassword"
              hint={smtpSaved ? "A password is saved. Leave blank to keep it." : "16-character Google app password"}
            >
              <TextInput id="smtpPassword" name="smtpPassword" type="password" autoComplete="new-password" />
            </Field>
            <Field label="SMTP host" name="smtpHost">
              <TextInput id="smtpHost" name="smtpHost" defaultValue={mail.googleSmtp.host} />
            </Field>
            <Field label="SMTP port" name="smtpPort" hint="465 for SSL, 587 for STARTTLS">
              <TextInput id="smtpPort" name="smtpPort" inputMode="numeric" defaultValue={String(mail.googleSmtp.port)} />
            </Field>
            <Field label="SMTP from name" name="smtpFromName">
              <TextInput id="smtpFromName" name="smtpFromName" defaultValue={mail.googleSmtp.fromName} />
            </Field>
            <Field label="SMTP from email" name="smtpFromEmail" hint="Usually the same as the Gmail address">
              <TextInput id="smtpFromEmail" name="smtpFromEmail" type="email" defaultValue={mail.googleSmtp.fromEmail} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Resend from name" name="resendFromName">
              <TextInput id="resendFromName" name="resendFromName" defaultValue={mail.resend.fromName} />
            </Field>
            <Field label="Resend from email" name="resendFromEmail" hint="Must be on a verified Resend domain">
              <TextInput id="resendFromEmail" name="resendFromEmail" type="email" defaultValue={mail.resend.fromEmail} />
            </Field>
            <Field
              label="Resend API key"
              name="resendApiKey"
              hint={resendKeySaved ? "A key is saved. Leave blank to keep it." : "Optional override of RESEND_API_KEY"}
              className="sm:col-span-2"
            >
              <TextInput id="resendApiKey" name="resendApiKey" type="password" autoComplete="new-password" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-brand/10 bg-paper p-5">
          <legend className="px-1 text-sm font-semibold">Which addresses send and receive what</legend>
          <p className="text-sm text-muted">
            Leave a From field blank to use the provider default above. Receive addresses are inboxes the website writes
            to.
          </p>
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Send to members and donors</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Membership and confirmation codes" name="mailMembershipFrom">
              <TextInput id="mailMembershipFrom" name="mailMembershipFrom" type="email" defaultValue={mail.roles.membershipFrom} />
            </Field>
            <Field label="Password reset" name="mailPasswordResetFrom">
              <TextInput id="mailPasswordResetFrom" name="mailPasswordResetFrom" type="email" defaultValue={mail.roles.passwordResetFrom} />
            </Field>
            <Field label="Donation receipts" name="mailDonationsFrom">
              <TextInput id="mailDonationsFrom" name="mailDonationsFrom" type="email" defaultValue={mail.roles.donationsFrom} />
            </Field>
            <Field label="Event registration" name="mailEventsFrom">
              <TextInput id="mailEventsFrom" name="mailEventsFrom" type="email" defaultValue={mail.roles.eventsFrom} />
            </Field>
            <Field label="Volunteer messages" name="mailVolunteersFrom">
              <TextInput id="mailVolunteersFrom" name="mailVolunteersFrom" type="email" defaultValue={mail.roles.volunteersFrom} />
            </Field>
            <Field label="Newsletter" name="mailNewsletterFrom">
              <TextInput id="mailNewsletterFrom" name="mailNewsletterFrom" type="email" defaultValue={mail.roles.newsletterFrom} />
            </Field>
          </div>
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Receive from the website</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact form inbox" name="mailContactTo">
              <TextInput id="mailContactTo" name="mailContactTo" type="email" defaultValue={mail.roles.contactTo} />
            </Field>
            <Field label="New membership alerts" name="mailMembershipNotifyTo">
              <TextInput
                id="mailMembershipNotifyTo"
                name="mailMembershipNotifyTo"
                type="email"
                defaultValue={mail.roles.membershipNotifyTo}
              />
            </Field>
            <Field label="Donation alerts" name="mailDonationsNotifyTo">
              <TextInput
                id="mailDonationsNotifyTo"
                name="mailDonationsNotifyTo"
                type="email"
                defaultValue={mail.roles.donationsNotifyTo}
              />
            </Field>
            <Field label="Volunteer application alerts" name="mailVolunteersNotifyTo">
              <TextInput
                id="mailVolunteersNotifyTo"
                name="mailVolunteersNotifyTo"
                type="email"
                defaultValue={mail.roles.volunteersNotifyTo}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 rounded-lg border border-brand/10 bg-paper p-5">
          <legend className="px-1 text-sm font-semibold">Bank transfer details</legend>
          <p className="text-sm text-muted">
            Spelled out on the public Donate page and on program Donate now forms while card gateways are not connected.
          </p>
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
        <Button type="submit" className="w-full sm:w-auto">
          Save settings
        </Button>
      </form>
    </div>
  );
}
