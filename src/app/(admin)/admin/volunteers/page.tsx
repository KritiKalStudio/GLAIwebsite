import { desc } from "drizzle-orm";
import { saveOpportunity } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { volunteerApplications, volunteerOpportunities } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { remainingSlots } from "@/lib/volunteer-slots";

export const dynamic = "force-dynamic";
export const metadata = { title: "Volunteers" };

export default async function AdminVolunteersPage() {
  await requireAdmin("volunteers");
  const db = getDb();
  const [apps, roles] = await Promise.all([
    db.select().from(volunteerApplications).orderBy(desc(volunteerApplications.createdAt)),
    db.select().from(volunteerOpportunities).orderBy(desc(volunteerOpportunities.createdAt)),
  ]);
  const remainingById: Record<string, number> = {};
  for (const role of roles) {
    remainingById[role.id] = await remainingSlots(role.id, role.slots);
  }
  const roleTitle = new Map(roles.map((role) => [role.id, role.title]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Volunteers</h1>
        <p className="mt-2 text-sm text-muted">
          Set slot counts for each role. Remaining slots are total minus members who currently hold the role.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl">Roles</h2>
        <ul className="mt-4 grid grid-cols-1 gap-4">
          {roles.map((role) => (
            <li key={role.id} className="rounded-lg border border-brand/10 bg-paper p-4 sm:p-5">
              <form action={saveOpportunity} className="grid grid-cols-1 gap-4">
                <input type="hidden" name="id" value={role.id} />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg">{role.title}</h3>
                  <p className="text-sm text-accent">
                    {remainingById[role.id]} of {role.slots} remaining
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Title" name="title">
                    <TextInput id={`title-${role.id}`} name="title" defaultValue={role.title} required />
                  </Field>
                  <Field label="Web address" name="slug">
                    <TextInput id={`slug-${role.id}`} name="slug" defaultValue={role.slug} required />
                  </Field>
                  <Field label="Location" name="location">
                    <TextInput id={`location-${role.id}`} name="location" defaultValue={role.location ?? ""} />
                  </Field>
                  <Field label="Slots" name="slots">
                    <TextInput
                      id={`slots-${role.id}`}
                      name="slots"
                      type="number"
                      min={0}
                      defaultValue={role.slots}
                      required
                    />
                  </Field>
                </div>
                <Field label="Description" name="description">
                  <TextArea id={`description-${role.id}`} name="description" defaultValue={role.description} required />
                </Field>
                <Field label="Status" name="status">
                  <Select id={`status-${role.id}`} name="status" defaultValue={role.status}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </Select>
                </Field>
                <Button type="submit" className="w-full sm:w-auto">
                  Save role
                </Button>
              </form>
            </li>
          ))}
        </ul>
        <form action={saveOpportunity} className="mt-6 grid max-w-xl grid-cols-1 gap-4 rounded-lg border border-brand/10 bg-paper p-5">
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
          <Field label="Slots" name="slots">
            <TextInput id="slots" name="slots" type="number" min={0} defaultValue={10} required />
          </Field>
          <Field label="Description" name="description">
            <TextArea id="description" name="description" required />
          </Field>
          <Field label="Status" name="status">
            <Select id="status" name="status" defaultValue="published">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Button type="submit" className="w-full sm:w-auto">
            Publish role
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl">Roster</h2>
        <p className="mt-1 text-sm text-muted">Members currently holding or previously holding a role.</p>
        <div className="mt-3 overflow-x-auto">
          <AdminTable headers={["Name", "Role", "Status", "Applied"]}>
            {apps.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  {row.fullName}
                  <span className="block text-xs text-muted">{row.email}</span>
                </td>
                <td className="px-4 py-3">
                  {row.opportunityId ? (roleTitle.get(row.opportunityId) ?? "Role removed") : "—"}
                </td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </section>
    </div>
  );
}
