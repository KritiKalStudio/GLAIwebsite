import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { savePage, savePageBlocks, savePageRichContent } from "@/app/actions/admin";
import { PageForm } from "@/components/admin/page-form";
import { PageRichContentForm } from "@/components/admin/page-rich-content-form";
import { getDb } from "@/db";
import { pageBlocks, pages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("content");
  const { id } = await params;
  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) notFound();
  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, id))
    .orderBy(asc(pageBlocks.sortOrder));
  const richBlock = blocks.find((block) => block.type === "rich_text");

  return (
    <div>
      <h1 className="font-display text-3xl">Edit: {page.title}</h1>
      <PageForm
        action={savePage}
        blocksAction={savePageBlocks}
        page={page}
        blocksJson={JSON.stringify(
          blocks.map((block) => ({ type: block.type, data: block.data })),
          null,
          2,
        )}
      />
      <div className="mt-10 max-w-3xl rounded-xl border border-brand/10 bg-paper p-6 shadow-sm">
        <PageRichContentForm pageId={page.id} blockId={richBlock?.id} body={typeof richBlock?.data.body === "string" ? richBlock.data.body : ""} action={savePageRichContent} />
      </div>
    </div>
  );
}
