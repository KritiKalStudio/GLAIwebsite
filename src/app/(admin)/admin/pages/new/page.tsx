import { savePage } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { PageForm } from "@/components/admin/page-form";

export const metadata = { title: "New page" };

export default async function NewPagePage() {
  await requireAdmin("content");
  return (
    <div>
      <h1 className="font-display text-3xl">New page</h1>
      <PageForm action={savePage} />
    </div>
  );
}
