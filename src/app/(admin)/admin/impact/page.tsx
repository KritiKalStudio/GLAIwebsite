import { asc } from "drizzle-orm";
import { saveImpactStat } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { impactStats } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impact figures" };

export default async function AdminImpactPage() {
  await requireAdmin("content");
  const rows = await getDb().select().from(impactStats).orderBy(asc(impactStats.sortOrder));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Impact figures</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Do not invent numbers. Keep “Pending verification” until GLAI supplies a verified figure and a source.
        </p>
      </div>
      <div className="grid gap-6">
        {rows.map((stat) => (
          <form
            key={stat.id}
            action={saveImpactStat}
            className="grid max-w-3xl gap-4 rounded-lg border border-brand/10 bg-paper p-5 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={stat.id} />
            <p className="text-xs tracking-wide text-accent uppercase sm:col-span-2">{stat.key}</p>
            <Field label="Label" name="label">
              <TextInput id={`label-${stat.id}`} name="label" defaultValue={stat.label} required />
            </Field>
            <Field label="Displayed value" name="valueDisplay">
              <TextInput
                id={`value-${stat.id}`}
                name="valueDisplay"
                defaultValue={stat.valueDisplay}
                required
              />
            </Field>
            <Field label="Source" name="source" className="sm:col-span-2">
              <TextInput id={`source-${stat.id}`} name="source" defaultValue={stat.source ?? ""} />
            </Field>
            <div>
              <Button type="submit">Save figure</Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
