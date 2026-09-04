import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProgramForm } from "@/components/admin/program-form";
import { getDb } from "@/db";
import { programs } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("programs");
  const { id } = await params;
  const [program] = await getDb().select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!program) notFound();
  return (
    <div>
      <h1 className="font-display text-3xl">Edit program</h1>
      <ProgramForm program={program} />
    </div>
  );
}
