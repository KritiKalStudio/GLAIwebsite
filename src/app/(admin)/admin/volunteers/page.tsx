import { desc } from "drizzle-orm";
import { acceptVolunteer, declineVolunteer, saveOpportunity } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { volunteerApplications, volunteerOpportunities } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Volunteers" };

export default async function AdminVolunteersPage() {
  await requireAdmin("volunteers");
  const db = getDb();
  const [apps, roles] = await Promise.all([
    db.select().from(volunteerApplications).orderBy(desc(volunteerApplications.createdAt)),
    db.select().from(volunteerOpportunities).orderBy(desc(volunteerOpportunities.createdAt)),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Volunteers</h1>
        <p className="mt-2 text-sm text-muted">Review applications and publish volunteer roles.</p>
      </div>
      <section>
        <h2 className="font-display text-xl">Applications</h2>
        <div className="mt-3">
          <AdminTable headers={["Name", "Country", "Status", "Applied", ""]}>
            {apps.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  {row.fullName}
                  <span className="block text-xs text-muted">{row.email}</span>
                </td>
                <td className="px-4 py-3">{row.country}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3">
                  {row.status === "applied" ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={acceptVolunteer}>
                        <input type="hidden" name="id" value={row.id} />
                        <Button type="submit" size="sm">
                          Accept
                        </Button>
                      </form>
                      <form action={declineVolunteer}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit message="Decline this volunteer application?">Decline</ConfirmSubmit>
                      </form>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl">Open roles</h2>
        <ul className="mt-3 divide-y divide-brand/10 rounded-lg border border-brand/10 bg-paper">
          {roles.map((role) => (
            <li key={role.id} className="px-4 py-3">
              <p className="font-semibold">{role.title}</p>
              <p className="text-sm text-muted">
                {role.location || "Location flexible"} · {role.status}
              </p>
            </li>
          ))}
        </ul>
        <form action={saveOpportunity} className="mt-6 grid max-w-xl gap-4 rounded-lg border border-brand/10 bg-paper p-5">
          <h3 className="font-display text-lg">Publish a role</h3>
          <Field label="Title" name="title">
            <TextInput id="title" name="title" required />
          </Field>
          <Field label="Web address" name="slug">
            <TextInput id="slug" name="slug" required />
          </Field>
          <Field label="Location" name="location">
            <TextInput id="location" name="location" />
          </Field>
          <Field label="Description" name="description">
            <TextArea id="description" name="description" required />
          </Field>
          <Button type="submit">Publish role</Button>
        </form>
      </section>
    </div>
  );
}
