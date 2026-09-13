import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";

export type MediaChoice = {
  id: string;
  url: string;
  filename: string;
  thumbnailUrl: string | null;
};

export async function listMediaLibrary(limit = 80): Promise<MediaChoice[]> {
  const rows = await getDb()
    .select({
      id: mediaAssets.id,
      url: mediaAssets.url,
      filename: mediaAssets.filename,
      thumbnailUrl: mediaAssets.thumbnailUrl,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    ...row,
    thumbnailUrl: row.thumbnailUrl || row.url,
  }));
}
