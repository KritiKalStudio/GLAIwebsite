import { asc } from "drizzle-orm";
import { deletePerson, savePerson } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { people } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leadership" };

function LeaderForm({
  person,
  media,
}: {
  person?: typeof people.$inferSelect;
  media: Awaited<ReturnType<typeof listMediaLibrary>>;
}) {
  const id = person?.id;
  return (
    <div className="rounded-lg border border-brand/10 bg-paper p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-xl">{id ? person.name : "Add a leader"}</h2>
        {id ? (
          <form action={deletePerson}>
            <input type="hidden" name="id" value={id} />
            <ConfirmSubmit message="Remove this profile from the About page?">Remove</ConfirmSubmit>
          </form>
        ) : null}
      </div>
      <form action={savePerson} className="grid grid-cols-1 gap-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <ImagePicker name="photoUrl" label="Profile picture" defaultValue={person?.photoUrl} assets={media} shape="round" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name">
          <TextInput id={id ? `name-${id}` : "name"} name="name" defaultValue={person?.name ?? ""} required />
        </Field>
        <Field label="Position" name="position">
          <TextInput
            id={id ? `position-${id}` : "position"}
            name="position"
            defaultValue={person?.position ?? ""}
            required
          />
        </Field>
        <Field label="Group" name="group">
          <Select id={id ? `group-${id}` : "group"} name="group" defaultValue={person?.group ?? "board"}>
            <option value="board">Board</option>
            <option value="executive">Executive</option>
            <option value="advisor">Advisor</option>
          </Select>
        </Field>
        <Field label="Order" name="sortOrder" hint="Lower numbers appear first.">
          <TextInput
            id={id ? `sort-${id}` : "sortOrder"}
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={person?.sortOrder ?? 0}
          />
        </Field>
      </div>
      <Field label="Responsibility" name="responsibility">
        <TextInput
          id={id ? `responsibility-${id}` : "responsibility"}
          name="responsibility"
          defaultValue={person?.responsibility ?? ""}
        />
      </Field>
      <Field label="Biography" name="bio">
        <TextArea id={id ? `bio-${id}` : "bio"} name="bio" defaultValue={person?.bio ?? ""} required />
      </Field>
      <Field label="Status" name="status">
        <Select id={id ? `status-${id}` : "status"} name="status" defaultValue={person?.status ?? "published"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>
      <Button type="submit" className="w-full sm:w-auto">
        {id ? "Save leader" : "Publish leader"}
      </Button>
      </form>
    </div>
  );
}

export default async function AdminLeadershipPage() {
  await requireAdmin("content");
  const [rows, media] = await Promise.all([
    getDb().select().from(people).orderBy(asc(people.sortOrder), asc(people.name)),
    listMediaLibrary(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Leadership</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          These profiles appear on the public About page. Add, edit, or remove people here. A round photo is shown on
          each card; upload from this device or pick from the media library.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-4">
        {rows.map((person) => (
          <li key={person.id}>
            <LeaderForm person={person} media={media} />
          </li>
        ))}
      </ul>
      <LeaderForm media={media} />
    </div>
  );
}
