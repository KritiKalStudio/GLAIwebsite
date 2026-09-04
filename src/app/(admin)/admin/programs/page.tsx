import Link from "next/link";
import { asc } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { ButtonLink } from "@/components/ui/button";
import { getDb } from "@/db";
import { programs } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Programs" };

export default async function AdminProgramsPage() {
  await requireAdmin("programs");
  const rows = await getDb().select().from(programs).orderBy(asc(programs.sortOrder));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Programs</h1>
        <ButtonLink href="/admin/programs/new">New program</ButtonLink>
      </div>
      <AdminTable headers={["Name", "Address", "Status", ""]}>
        {rows.map((program) => (
          <tr key={program.id}>
            <td className="px-4 py-3">{program.name}</td>
            <td className="px-4 py-3 text-muted">{program.slug}</td>
            <td className="px-4 py-3">{program.status}</td>
            <td className="px-4 py-3">
              <Link className="text-accent" href={`/admin/programs/${program.id}`}>
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
