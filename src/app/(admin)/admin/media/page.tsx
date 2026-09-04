import { desc } from "drizzle-orm";
import { uploadMedia } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media library" };

export default async function AdminMediaPage() {
  await requireAdmin("content");
  const rows = await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Media library</h1>
        <p className="mt-2 text-sm text-muted">Files are stored in Cloudflare R2. Copy the URL into page or story fields.</p>
      </div>
      <form action={uploadMedia} className="max-w-xl rounded-lg border border-brand/10 bg-paper p-5">
        <Field label="Choose a file" name="file">
          <input id="file" name="file" type="file" required className="block w-full text-sm" />
        </Field>
        <div className="mt-4">
          <Button type="submit">Upload</Button>
        </div>
      </form>
      <AdminTable headers={["File", "Type", "URL", "Uploaded"]}>
        {rows.map((asset) => (
          <tr key={asset.id}>
            <td className="px-4 py-3">{asset.filename}</td>
            <td className="px-4 py-3">{asset.mimeType}</td>
            <td className="max-w-xs truncate px-4 py-3">
              <a href={asset.url} className="text-accent" target="_blank" rel="noreferrer">
                {asset.url}
              </a>
            </td>
            <td className="px-4 py-3">{formatDate(asset.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
