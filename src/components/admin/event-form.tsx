import { saveEvent } from "@/app/actions/admin";
import { EventFieldsEditor } from "@/components/admin/event-fields-editor";
import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import type { EventCustomField } from "@/db/schema";
import type { MediaChoice } from "@/lib/content/media";
import { registrationIsOpen } from "@/lib/events/portal";
import { toDatetimeLocal } from "@/lib/format";

export function EventForm({
  event,
  media,
}: {
  event?: {
    id: string;
    title: string;
    description: string;
    startsAt: Date | null;
    endsAt: Date | null;
    timezone: string;
    city: string | null;
    country: string | null;
    address: string | null;
    venueName: string | null;
    isOnline: boolean;
    onlineUrl: string | null;
    capacity: number | null;
    registrationOpen: boolean;
    registrationType: string;
    featuredImageUrl: string | null;
    thumbnailUrl: string | null;
    youtubeUrl: string | null;
    postEventReport: string | null;
    customFields: EventCustomField[];
    reminderOffsetsHours: number[];
    status: string;
  };
  media: MediaChoice[];
}) {
  const offsets = new Set(event?.reminderOffsetsHours ?? [168, 24]);
  const customHours = [...offsets].filter((hours) => hours !== 168 && hours !== 24 && hours !== 2);
  const registrationOn = event ? registrationIsOpen(event) : false;

  return (
    <form action={saveEvent} className="mt-6 grid max-w-3xl gap-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <Field
        label="Title"
        name="title"
        hint="The public link is created from this title. “Lagos dialogue” becomes /events/lagos-dialogue. A street address goes in Address below."
      >
        <TextInput id="title" name="title" defaultValue={event?.title ?? ""} />
      </Field>
      <Field label="Description" name="description" hint="Optional.">
        <TextArea id="description" name="description" className="min-h-40" defaultValue={event?.description ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" name="startsAt" hint="Optional. Reminders are sent only when a start time is set.">
          <TextInput id="startsAt" name="startsAt" type="datetime-local" defaultValue={toDatetimeLocal(event?.startsAt)} />
        </Field>
        <Field label="Ends" name="endsAt">
          <TextInput id="endsAt" name="endsAt" type="datetime-local" defaultValue={toDatetimeLocal(event?.endsAt)} />
        </Field>
      </div>
      <Field label="Timezone" name="timezone">
        <TextInput id="timezone" name="timezone" defaultValue={event?.timezone ?? "Africa/Lagos"} />
      </Field>
      <Field label="Venue" name="venueName">
        <TextInput id="venueName" name="venueName" defaultValue={event?.venueName ?? ""} />
      </Field>
      <Field label="Address" name="address">
        <TextInput id="address" name="address" defaultValue={event?.address ?? ""} />
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
      <ImagePicker
        name="featuredImageUrl"
        label="Header picture"
        defaultValue={event?.featuredImageUrl}
        assets={media}
      />
      <ImagePicker
        name="thumbnailUrl"
        label="Thumbnail"
        defaultValue={event?.thumbnailUrl}
        assets={media}
      />
      <Field label="YouTube URL" name="youtubeUrl">
        <TextInput id="youtubeUrl" name="youtubeUrl" defaultValue={event?.youtubeUrl ?? ""} />
      </Field>
      <Field label="Post-event report" name="postEventReport">
        <TextArea id="postEventReport" name="postEventReport" defaultValue={event?.postEventReport ?? ""} />
      </Field>
      <Field label="Capacity" name="capacity" hint="Leave blank for no limit. Guests who decline do not take a place.">
        <TextInput id="capacity" name="capacity" type="number" min={0} defaultValue={event?.capacity ?? ""} />
      </Field>
      <Field label="Registration kind" name="registrationType">
        <Select id="registrationType" name="registrationType" defaultValue={event?.registrationType === "ticketed" ? "ticketed" : "free"}>
          <option value="free">Free</option>
          <option value="ticketed">Ticketed</option>
        </Select>
      </Field>
      <label className="flex items-center gap-2 rounded-md border border-brand/10 bg-paper px-3 py-3 text-sm">
        <input type="checkbox" name="registrationOpen" defaultChecked={registrationOn} />
        Registration is open
      </label>
      <fieldset className="grid gap-2 rounded-md border border-brand/10 p-4">
        <legend className="px-1 text-sm font-semibold">Email reminders</legend>
        <p className="text-xs text-muted">
          Sent to guests who are attending or undecided. Automatic mail goes out once each morning, Lagos time, so
          7-day and 1-day reminders are covered. A 2-hour reminder is not sent by that morning run. Use Send due
          reminders on the saved event when you want it.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remind168" defaultChecked={!event || offsets.has(168)} />
          7 days before
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remind24" defaultChecked={!event || offsets.has(24)} />
          1 day before
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remind2" defaultChecked={offsets.has(2)} />
          2 hours before
        </label>
        <Field label="Other reminders" name="remindCustom" hint="Hours before the start, separated by commas.">
          <TextInput id="remindCustom" name="remindCustom" defaultValue={customHours.join(", ")} />
        </Field>
      </fieldset>
      <EventFieldsEditor initial={event?.customFields ?? []} />
      <Field label="Status" name="status" hint="Visitors can open the public page only when this is Published.">
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
