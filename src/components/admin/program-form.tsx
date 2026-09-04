import { saveProgram } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";

export function ProgramForm({
  program,
}: {
  program?: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    purpose: string;
    whoCanParticipate: string | null;
    process: string | null;
    outcomes: string | null;
    applyCtaLabel: string | null;
    applyHref: string | null;
    featuredImageUrl: string | null;
    youtubeUrl: string | null;
    status: string;
  };
}) {
  return (
    <form action={saveProgram} className="mt-6 grid max-w-3xl gap-4">
      {program ? <input type="hidden" name="id" value={program.id} /> : null}
      <Field label="Program name" name="name">
        <TextInput id="name" name="name" defaultValue={program?.name} required />
      </Field>
      <Field label="Web address" name="slug" hint="Example: love-ambassador-training">
        <TextInput id="slug" name="slug" defaultValue={program?.slug} required />
      </Field>
      <Field label="Short description" name="shortDescription">
        <TextArea id="shortDescription" name="shortDescription" defaultValue={program?.shortDescription} required />
      </Field>
      <Field label="Purpose" name="purpose">
        <TextArea id="purpose" name="purpose" className="min-h-40" defaultValue={program?.purpose} required />
      </Field>
      <Field label="Who can participate" name="whoCanParticipate">
        <TextArea id="whoCanParticipate" name="whoCanParticipate" defaultValue={program?.whoCanParticipate ?? ""} />
      </Field>
      <Field label="Process" name="process">
        <TextArea id="process" name="process" defaultValue={program?.process ?? ""} />
      </Field>
      <Field label="Outcomes" name="outcomes">
        <TextArea id="outcomes" name="outcomes" defaultValue={program?.outcomes ?? ""} />
      </Field>
      <Field label="Button label" name="applyCtaLabel">
        <TextInput id="applyCtaLabel" name="applyCtaLabel" defaultValue={program?.applyCtaLabel ?? ""} />
      </Field>
      <Field label="Button link" name="applyHref">
        <TextInput id="applyHref" name="applyHref" defaultValue={program?.applyHref ?? ""} />
      </Field>
      <Field label="Image URL" name="featuredImageUrl">
        <TextInput id="featuredImageUrl" name="featuredImageUrl" defaultValue={program?.featuredImageUrl ?? ""} />
      </Field>
      <Field label="YouTube URL" name="youtubeUrl">
        <TextInput id="youtubeUrl" name="youtubeUrl" defaultValue={program?.youtubeUrl ?? ""} />
      </Field>
      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={program?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="preview">Preview</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>
      <Button type="submit">Save program</Button>
    </form>
  );
}
