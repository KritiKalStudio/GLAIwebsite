import { desc } from "drizzle-orm";
import { uploadMedia } from "@/app/actions/admin";
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
        <p className="mt-2 text-sm text-muted">
          Upload from this device. Pictures are stored in Cloudflare R2 and appear as thumbnails you can pick when
          editing stories, events, programs, and projects.
        </p>
      </div>
      <form action={uploadMedia} className="max-w-xl rounded-lg border border-brand/10 bg-paper p-5">
        <Field label="Choose a picture" name="file">
          <input
            id="file"
            name="file"
            type="file"
            accept="image/*"
            required
            className="block min-h-11 w-full text-sm"
          />
        </Field>
        <div className="mt-4">
          <Button type="submit" className="w-full sm:w-auto">
            Upload
          </Button>
        </div>
      </form>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((asset) => {
          const src = asset.thumbnailUrl || asset.url;
          return (
            <li key={asset.id} className="overflow-hidden rounded-lg border border-brand/10 bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={asset.alt ?? ""} className="aspect-square w-full object-cover" />
              <div className="space-y-1 p-3">
                <p className="truncate text-xs font-medium">{asset.filename}</p>
                <p className="text-[11px] text-muted">{formatDate(asset.createdAt, "d MMM yyyy")}</p>
                <a href={asset.url} className="block truncate text-[11px] text-accent" target="_blank" rel="noreferrer">
                  Open original
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
