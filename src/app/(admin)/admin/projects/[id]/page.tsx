import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("programs");
  const { id } = await params;
  const [[project], media] = await Promise.all([
    getDb().select().from(projects).where(eq(projects.id, id)).limit(1),
    listMediaLibrary(),
  ]);
  if (!project) notFound();
  return (
    <div>
      <h1 className="font-display text-3xl">Edit project</h1>
      <ProjectForm project={project} media={media} />
    </div>
  );
}
