import { deleteProgram, saveProgram } from "@/app/actions/admin";
import { ImagePicker } from "@/components/admin/image-picker";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import type { MediaChoice } from "@/lib/content/media";
import { toDatetimeLocal } from "@/lib/format";

export function ProgramForm({
  program,
  media,
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
    startsAt: Date | null;
    endsAt: Date | null;
    goalAmount: string | null;
    currency: string;
    status: string;
  };
  media: MediaChoice[];
}) {
  return (
    <div className="mt-6 grid max-w-3xl gap-8">
      <form action={saveProgram} className="grid gap-4">
        {program ? <input type="hidden" name="id" value={program.id} /> : null}
        <Field label="Program / campaign name" name="name">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campaign starts" name="startsAt">
            <TextInput id="startsAt" name="startsAt" type="datetime-local" defaultValue={toDatetimeLocal(program?.startsAt)} />
          </Field>
          <Field label="Campaign ends" name="endsAt">
            <TextInput id="endsAt" name="endsAt" type="datetime-local" defaultValue={toDatetimeLocal(program?.endsAt)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fundraising goal" name="goalAmount">
            <TextInput id="goalAmount" name="goalAmount" inputMode="numeric" defaultValue={program?.goalAmount ?? ""} />
          </Field>
          <Field label="Currency" name="currency">
            <TextInput id="currency" name="currency" defaultValue={program?.currency ?? "NGN"} />
          </Field>
        </div>
        <Field label="Button label" name="applyCtaLabel">
          <TextInput id="applyCtaLabel" name="applyCtaLabel" defaultValue={program?.applyCtaLabel ?? ""} />
        </Field>
        <Field label="Button link" name="applyHref">
          <TextInput id="applyHref" name="applyHref" defaultValue={program?.applyHref ?? ""} />
        </Field>
        <ImagePicker name="featuredImageUrl" label="Picture" defaultValue={program?.featuredImageUrl} assets={media} />
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
        <Button type="submit" className="w-full sm:w-auto">
          Save program
        </Button>
      </form>
      {program ? (
        <form action={deleteProgram}>
          <input type="hidden" name="id" value={program.id} />
          <ConfirmSubmit message="Remove this program/campaign from the site?">Delete program</ConfirmSubmit>
        </form>
      ) : null}
    </div>
  );
}
