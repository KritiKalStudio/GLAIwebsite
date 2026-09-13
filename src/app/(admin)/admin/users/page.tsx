import { desc, eq } from "drizzle-orm";
import { fulfillDataDeletion, saveUser, updateAdminPrivileges } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { roles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { isPrimaryAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const privileges = [["content", "Website content"], ["programs", "Programs & projects"], ["membership", "Membership"], ["events", "Events"], ["donations", "Donations"], ["volunteers", "Volunteers"], ["users", "Staff records"], ["settings", "Settings"]] as const;

export const dynamic = "force-dynamic";
export const metadata = { title: "Administrators" };

export default async function AdminUsersPage() {
  const current = await requireAdmin("users");
  const staff = await getDb().select({ id: users.id, roleId: users.roleId, name: users.name, email: users.email, isActive: users.isActive, createdAt: users.createdAt, roleName: roles.name, permissions: roles.permissions }).from(users).leftJoin(roles, eq(users.roleId, roles.id)).orderBy(desc(users.createdAt));
  const administrators = staff.filter((person) => person.roleId);
  const primary = isPrimaryAdmin(current);

  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 border-b border-brand/10 pb-6 md:flex-row md:items-end"><div><p className="eyebrow">People & governance</p><h1 className="mt-2 font-display text-4xl text-brand">Administrator access</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Create individual administrator accounts, define precisely what each person can manage, and deactivate access immediately when it is no longer needed.</p></div><p className="rounded-full bg-hope/15 px-3 py-1.5 text-xs font-semibold text-ink">{administrators.length} access profile{administrators.length === 1 ? "" : "s"}</p></div>

    <AdminTable headers={["Administrator", "Access", "Status", "Added"]}>{administrators.map((person) => <tr key={person.id}><td className="px-4 py-3"><p className="font-semibold text-brand">{person.name}</p><p className="mt-0.5 text-xs text-muted">{person.email}</p></td><td className="px-4 py-3 text-sm">{person.email === current.email && primary ? "Primary administrator" : person.roleName ?? "No access"}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${person.isActive ? "bg-hope/15 text-ink" : "bg-danger/10 text-danger"}`}>{person.isActive ? "Active" : "Suspended"}</span></td><td className="px-4 py-3 text-muted">{formatDate(person.createdAt)}</td></tr>)}</AdminTable>

    {primary ? <>
      <section className="admin-panel grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.72fr)]"><div><p className="eyebrow">Create access</p><h2 className="mt-2 font-display text-2xl text-brand">Add a sub-administrator</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Every administrator receives an individual role profile. Their privilege switches do not affect anyone else.</p></div><form action={saveUser} className="grid gap-4"><Field label="Full name" name="name"><TextInput id="name" name="name" required /></Field><Field label="Work email" name="email"><TextInput id="email" name="email" type="email" required /></Field><Field label="Temporary password" name="password" hint="At least 10 characters; share securely."><TextInput id="password" name="password" type="password" minLength={10} required /></Field><Field label="Role title" name="roleTitle"><TextInput id="roleTitle" name="roleTitle" placeholder="e.g. Field Operations Coordinator" /></Field><PrivilegeControls /><Button type="submit">Create administrator</Button></form></section>
      <section className="space-y-4"><div><p className="eyebrow">Privilege control</p><h2 className="mt-2 font-display text-2xl text-brand">Manage existing access</h2></div><div className="grid gap-5 xl:grid-cols-2">{administrators.filter((person) => person.email !== current.email).map((person) => <form key={person.id} action={updateAdminPrivileges} className="admin-panel p-5"><input type="hidden" name="id" value={person.id} /><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-xl text-brand">{person.name}</h3><p className="mt-1 text-sm text-muted">{person.email}</p></div><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted"><input name="isActive" type="checkbox" defaultChecked={person.isActive} className="h-4 w-4 accent-hope" />Active</label></div><Field label="Role title" name="roleTitle" className="mt-5"><TextInput id={`role-${person.id}`} name="roleTitle" defaultValue={person.roleName ?? "Sub-administrator"} /></Field><PrivilegeControls permissions={person.permissions ?? {}} suffix={person.id} /><Button type="submit" variant="outline" className="mt-5">Save access</Button></form>)}</div></section>
    </> : <section className="rounded-xl border border-sunshine/35 bg-sunshine/10 p-5 text-sm leading-relaxed text-ink">Only the primary administrator can create accounts or change privileges. Primary administrator identity and credentials are configured through environment variables.</section>}

    <section className="admin-panel grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.72fr)]">
      <div>
        <p className="eyebrow">Privacy</p>
        <h2 className="mt-2 font-display text-2xl text-brand">Fulfil a deletion request</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Enter the email from a Privacy / deletion request. Personal fields are redacted, the account is deactivated, and only records the law requires are kept.
        </p>
      </div>
      <form action={fulfillDataDeletion} className="grid gap-4">
        <Field label="Email to redact" name="email">
          <TextInput id="deletion-email" name="email" type="email" required />
        </Field>
        <ConfirmSubmit message="Redact this person's personal data? This cannot be undone.">Fulfil deletion</ConfirmSubmit>
      </form>
    </section>
  </div>;
}

function PrivilegeControls({ permissions = {}, suffix = "new" }: { permissions?: Record<string, boolean>; suffix?: string }) {
  return <fieldset className="mt-1"><legend className="text-sm font-semibold text-ink">Grant privileges</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{privileges.map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-brand/10 bg-mist/60 px-3 py-2.5 text-sm font-medium text-ink"><span>{label}</span><input id={`${key}-${suffix}`} name={`permission-${key}`} type="checkbox" defaultChecked={Boolean(permissions[key])} className="h-4 w-4 accent-hope" /></label>)}</div></fieldset>;
}
