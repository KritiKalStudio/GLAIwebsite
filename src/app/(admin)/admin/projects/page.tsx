import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { ButtonLink } from "@/components/ui/button";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  await requireAdmin("programs");
  const rows = await getDb().select().from(projects).orderBy(desc(projects.lastUpdated));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Projects</h1>
        <ButtonLink href="/admin/projects/new">New project</ButtonLink>
      </div>
      <AdminTable headers={["Title", "Country", "Focus", "Status", ""]}>
        {rows.map((project) => (
          <tr key={project.id}>
            <td className="px-4 py-3">{project.title}</td>
            <td className="px-4 py-3">{project.country}</td>
            <td className="px-4 py-3">{project.focusArea.replaceAll("_", " ")}</td>
            <td className="px-4 py-3">{project.status}</td>
            <td className="px-4 py-3">
              <Link className="text-accent" href={`/admin/projects/${project.id}`}>
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
