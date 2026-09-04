import Link from "next/link";
import { saveFaq } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  await requireAdmin("content");
  const rows = await getDb().select().from(pages);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Pages</h1>
        <ButtonLink href="/admin/pages/new">New page</ButtonLink>
      </div>
      <AdminTable headers={["Title", "Address", "Language", "Status", ""]}>
        {rows.map((page) => (
          <tr key={page.id}>
            <td className="px-4 py-3">{page.title}</td>
            <td className="px-4 py-3 text-muted">{page.slug}</td>
            <td className="px-4 py-3 text-muted">{page.locale}</td>
            <td className="px-4 py-3">{page.status}</td>
            <td className="px-4 py-3">
              <Link className="text-accent" href={`/admin/pages/${page.id}`}>
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
      <form action={saveFaq} className="grid max-w-xl gap-4 rounded-lg border border-brand/10 bg-paper p-5">
        <h2 className="font-display text-xl">Add a frequently asked question</h2>
        <Field label="Question" name="question">
          <TextInput id="question" name="question" required />
        </Field>
        <Field label="Answer" name="answer">
          <TextArea id="answer" name="answer" required />
        </Field>
        <Field label="Audience" name="audience">
          <TextInput id="audience" name="audience" defaultValue="general" />
        </Field>
        <Button type="submit">Publish question</Button>
      </form>
    </div>
  );
}
