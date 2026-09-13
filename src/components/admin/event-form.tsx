import { saveEvent } from "@/app/actions/admin";
import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import type { MediaChoice } from "@/lib/content/media";
import { toDatetimeLocal } from "@/lib/format";

export function EventForm({
  event,
  media,
}: {
  event?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date | null;
    timezone: string;
    city: string | null;
    country: string | null;
    venueName: string | null;
    isOnline: boolean;
    onlineUrl: string | null;
    capacity: number | null;
    registrationType: string;
    featuredImageUrl: string | null;
    youtubeUrl: string | null;
    postEventReport: string | null;
    status: string;
  };
  media: MediaChoice[];
}) {
  return (
    <form action={saveEvent} className="mt-6 grid max-w-3xl gap-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <Field label="Title" name="title">
        <TextInput id="title" name="title" defaultValue={event?.title} required />
      </Field>
      <Field label="Web address" name="slug">
        <TextInput id="slug" name="slug" defaultValue={event?.slug} required />
      </Field>
      <Field label="Description" name="description">
        <TextArea id="description" name="description" className="min-h-40" defaultValue={event?.description} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" name="startsAt">
          <TextInput
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event?.startsAt)}
            required
          />
        </Field>
        <Field label="Ends" name="endsAt">
          <TextInput
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(event?.endsAt)}
          />
        </Field>
      </div>
      <Field label="Timezone" name="timezone">
        <TextInput id="timezone" name="timezone" defaultValue={event?.timezone ?? "Africa/Lagos"} />
      </Field>
      <Field label="Venue" name="venueName">
        <TextInput id="venueName" name="venueName" defaultValue={event?.venueName ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city">
          <TextInput id="city" name="city" defaultValue={event?.city ?? ""} />
        </Field>
        <Field label="Country" name="country">
          <TextInput id="country" name="country" defaultValue={event?.country ?? ""} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isOnline" defaultChecked={event?.isOnline} />
        This event is online
      </label>
      <Field label="Online link" name="onlineUrl">
        <TextInput id="onlineUrl" name="onlineUrl" defaultValue={event?.onlineUrl ?? ""} />
      </Field>
      <Field label="Capacity" name="capacity" hint="Leave blank for no limit">
        <TextInput
          id="capacity"
          name="capacity"
          type="number"
          min={0}
          defaultValue={event?.capacity ?? ""}
        />
      </Field>
      <Field label="Registration" name="registrationType">
        <Select id="registrationType" name="registrationType" defaultValue={event?.registrationType ?? "free"}>
          <option value="free">Free</option>
          <option value="ticketed">Ticketed</option>
          <option value="closed">Closed</option>
        </Select>
      </Field>
      <ImagePicker name="featuredImageUrl" label="Picture" defaultValue={event?.featuredImageUrl} assets={media} />
      <Field label="YouTube URL" name="youtubeUrl">
        <TextInput id="youtubeUrl" name="youtubeUrl" defaultValue={event?.youtubeUrl ?? ""} />
      </Field>
      <Field label="Post-event report" name="postEventReport">
        <TextArea id="postEventReport" name="postEventReport" defaultValue={event?.postEventReport ?? ""} />
      </Field>
      <Field label="Status" name="status">
        <Select id="status" name="status" defaultValue={event?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="preview">Preview</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </Field>
      <Button type="submit">Save event</Button>
    </form>
  );
}
