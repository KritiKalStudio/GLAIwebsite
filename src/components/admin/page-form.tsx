import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";

export function PageForm({
  action,
  blocksAction,
  page,
  blocksJson,
}: {
  action: (formData: FormData) => Promise<void>;
  blocksAction?: (formData: FormData) => Promise<void>;
  page?: {
    id: string;
    slug: string;
    locale: string;
    title: string;
    description: string | null;
    status: string;
    seoTitle: string | null;
    seoDescription: string | null;
  };
  blocksJson?: string;
}) {
  return (
    <div className="mt-6 grid max-w-3xl gap-8">
      <form action={action} className="grid gap-4">
        {page ? <input type="hidden" name="id" value={page.id} /> : null}
        <Field label="Title" name="title">
          <TextInput id="title" name="title" defaultValue={page?.title} required />
        </Field>
        <Field label="Web address (slug)" name="slug" hint="Example: about or legal/privacy">
          <TextInput id="slug" name="slug" defaultValue={page?.slug} required />
        </Field>
        <Field
          label="Language"
          name="locale"
          hint="Must match an active language code in Site settings (en, fr, ar, pt). Same address can exist once per language."
        >
          <TextInput id="locale" name="locale" defaultValue={page?.locale ?? "en"} required />
        </Field>
        <Field label="Short description" name="description">
          <TextArea id="description" name="description" defaultValue={page?.description ?? ""} />
        </Field>
        <Field label="Status" name="status">
          <Select id="status" name="status" defaultValue={page?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="preview">Preview</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <Field label="SEO title" name="seoTitle">
          <TextInput id="seoTitle" name="seoTitle" defaultValue={page?.seoTitle ?? ""} />
        </Field>
        <Field label="SEO description" name="seoDescription">
          <TextArea id="seoDescription" name="seoDescription" defaultValue={page?.seoDescription ?? ""} />
        </Field>
        <Button type="submit">Save page</Button>
      </form>
      {page && blocksAction && blocksJson !== undefined ? (
        <form action={blocksAction} className="grid gap-4">
          <input type="hidden" name="pageId" value={page.id} />
          <Field
            label="Page blocks (JSON)"
            name="blocks"
            hint="An ordered list of blocks: hero, problem, stat_strip, card_grid, gallery, map, testimonial, rich_text, cta_banner, donate, stories, people, faq, video."
          >
            <TextArea
              id="blocks"
              name="blocks"
              className="min-h-80 font-mono text-xs"
              defaultValue={blocksJson}
            />
          </Field>
          <Button type="submit">Save blocks</Button>
        </form>
      ) : null}
    </div>
  );
}
