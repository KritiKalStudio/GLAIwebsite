import { ProgramForm } from "@/components/admin/program-form";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";

export const metadata = { title: "New program" };

export default async function NewProgramPage() {
  await requireAdmin("programs");
  const media = await listMediaLibrary();
  return (
    <div>
      <h1 className="font-display text-3xl">New program / campaign</h1>
      <p className="mt-2 text-sm text-muted">
        Published programs appear on Our Work. They count as active campaigns while today falls inside the period you set.
      </p>
      <ProgramForm media={media} />
    </div>
  );
}
