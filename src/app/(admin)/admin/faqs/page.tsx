import { asc } from "drizzle-orm";
import { deleteFaq, saveFaq } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { faqItems } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQs" };

export default async function AdminFaqsPage() {
  await requireAdmin("content");
  const rows = await getDb().select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.question));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Frequently asked questions</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          These answers appear on the public FAQ page. Add or remove questions here; the page layout stays in the
          website code.
        </p>
      </div>
      <AdminTable headers={["Question", "Audience", ""]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">
              {row.question}
              <span className="mt-1 block text-xs text-muted">{row.answer}</span>
            </td>
            <td className="px-4 py-3 text-muted">{row.audience}</td>
            <td className="px-4 py-3">
              <form action={deleteFaq}>
                <input type="hidden" name="id" value={row.id} />
                <ConfirmSubmit message="Remove this question from the public FAQ?">Remove</ConfirmSubmit>
              </form>
            </td>
          </tr>
        ))}
      </AdminTable>
      <form action={saveFaq} className="grid max-w-xl gap-4 rounded-lg border border-brand/10 bg-paper p-5">
        <h2 className="font-display text-xl">Add a question</h2>
        <Field label="Question" name="question">
          <TextInput id="question" name="question" required />
        </Field>
        <Field label="Answer" name="answer">
          <TextArea id="answer" name="answer" required />
        </Field>
        <Field label="Audience" name="audience" hint="general, ambassadors, donors, partners, or media">
          <TextInput id="audience" name="audience" defaultValue="general" />
        </Field>
        <Button type="submit">Publish question</Button>
      </form>
    </div>
  );
}
