import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin("programs");
  const media = await listMediaLibrary();
  return (
    <div>
      <h1 className="font-display text-3xl">New project</h1>
      <ProjectForm media={media} />
    </div>
  );
}
