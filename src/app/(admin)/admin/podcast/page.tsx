import { asc, desc } from "drizzle-orm";
import { deleteYoutubeVideo, saveYoutubeVideo } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { youtubeVideos } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { youtubeWatchUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const metadata = { title: "Podcast & YouTube" };

export default async function AdminPodcastPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin("content");
  const { edit } = await searchParams;
  const rows = await getDb()
    .select()
    .from(youtubeVideos)
    .orderBy(asc(youtubeVideos.collection), asc(youtubeVideos.sortOrder), desc(youtubeVideos.createdAt));
  const editing = rows.find((row) => row.id === edit);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Podcast & YouTube</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Paste a video link from the podcast channel or the news channel. Podcast episodes appear on the public
          Podcast page. News films appear on Stories & News. Visitors can watch on the website or open the same video
          on YouTube.
        </p>
      </div>
      <AdminTable headers={["Title", "Channel", "Status", ""]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">
              {row.title}
              <span className="mt-1 block text-xs text-muted">{row.youtubeId}</span>
            </td>
            <td className="px-4 py-3 capitalize">{row.collection}</td>
            <td className="px-4 py-3">{row.status}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={`/admin/podcast?edit=${row.id}`} variant="ghost" size="sm">
                  Edit
                </ButtonLink>
                <ButtonLink href={youtubeWatchUrl(row.youtubeId)} variant="ghost" size="sm">
                  YouTube
                </ButtonLink>
                <form action={deleteYoutubeVideo}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmSubmit message="Remove this video from the public site?">Remove</ConfirmSubmit>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
      <form action={saveYoutubeVideo} className="grid max-w-xl gap-4 rounded-lg border border-brand/10 bg-paper p-5">
        <h2 className="font-display text-xl">{editing ? "Edit video" : "Add a YouTube video"}</h2>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <Field label="YouTube link" name="youtubeUrl" hint="A watch, youtu.be, shorts, or embed URL — not the channel page.">
          <TextInput id="youtubeUrl" name="youtubeUrl" required defaultValue={editing?.youtubeUrl ?? ""} placeholder="https://www.youtube.com/watch?v=" />
        </Field>
        <Field label="Title" name="title" hint="Leave blank to use the title YouTube publishes.">
          <TextInput id="title" name="title" defaultValue={editing?.title ?? ""} />
        </Field>
        <Field label="Description" name="description">
          <TextArea id="description" name="description" defaultValue={editing?.description ?? ""} />
        </Field>
        <Field label="Channel" name="collection">
          <Select id="collection" name="collection" defaultValue={editing?.collection ?? "podcast"}>
            <option value="podcast">Podcast</option>
            <option value="news">News</option>
          </Select>
        </Field>
        <Field label="Sort order" name="sortOrder" hint="Lower numbers appear first.">
          <TextInput id="sortOrder" name="sortOrder" type="number" defaultValue={String(editing?.sortOrder ?? 0)} />
        </Field>
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue={editing?.status ?? "published"}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{editing ? "Save video" : "Publish video"}</Button>
          {editing ? (
            <ButtonLink href="/admin/podcast" variant="ghost">
              Cancel
            </ButtonLink>
          ) : null}
        </div>
      </form>
    </div>
  );
}
