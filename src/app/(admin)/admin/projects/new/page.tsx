import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin("programs");
  return (
    <div>
      <h1 className="font-display text-3xl">New project</h1>
      <ProjectForm />
    </div>
  );
}
