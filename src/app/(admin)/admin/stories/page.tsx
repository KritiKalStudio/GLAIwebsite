import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminTable } from "@/components/admin/admin-shell";
import { ButtonLink } from "@/components/ui/button";
import { getDb } from "@/db";
import { stories } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stories" };

export default async function AdminStoriesPage() {
  await requireAdmin("content");
  const rows = await getDb().select().from(stories).orderBy(desc(stories.updatedAt));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Stories</h1>
        <ButtonLink href="/admin/stories/new">New story</ButtonLink>
      </div>
      <AdminTable headers={["Title", "Category", "Status", ""]}>
        {rows.map((story) => (
          <tr key={story.id}>
            <td className="px-4 py-3">{story.title}</td>
            <td className="px-4 py-3">{story.category}</td>
            <td className="px-4 py-3">{story.status}</td>
            <td className="px-4 py-3">
              <Link className="text-accent" href={`/admin/stories/${story.id}`}>
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
