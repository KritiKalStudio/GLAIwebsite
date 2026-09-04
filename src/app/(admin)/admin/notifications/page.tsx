import { saveNotificationTemplate } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { notificationTemplates } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email wording" };

export default async function AdminNotificationsPage() {
  await requireAdmin("settings");
  const templates = await getDb().select().from(notificationTemplates);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Email wording</h1>
        <p className="mt-2 text-sm text-muted">
          Placeholders look like {"{{name}}"}. Changing a template here updates the next email that uses it.
        </p>
      </div>
      <div className="grid gap-8">
        {templates.map((template) => (
          <form
            key={template.id}
            action={saveNotificationTemplate}
            className="grid max-w-3xl gap-4 rounded-lg border border-brand/10 bg-paper p-5"
          >
            <input type="hidden" name="id" value={template.id} />
            <p className="text-xs tracking-wide text-accent uppercase">{template.type}</p>
            <Field label="Subject" name="subject">
              <TextInput id={`subject-${template.id}`} name="subject" defaultValue={template.subject} required />
            </Field>
            <Field label="Body" name="body">
              <TextArea
                id={`body-${template.id}`}
                name="body"
                className="min-h-40"
                defaultValue={template.body}
                required
              />
            </Field>
            <Button type="submit">Save this email</Button>
          </form>
        ))}
      </div>
    </div>
  );
}
