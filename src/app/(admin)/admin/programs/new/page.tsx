import { ProgramForm } from "@/components/admin/program-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "New program" };

export default async function NewProgramPage() {
  await requireAdmin("programs");
  return (
    <div>
      <h1 className="font-display text-3xl">New program</h1>
      <ProgramForm />
    </div>
  );
}
