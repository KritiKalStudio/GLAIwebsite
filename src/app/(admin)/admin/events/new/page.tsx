import { EventForm } from "@/components/admin/event-form";
import { requireAdmin } from "@/lib/admin";
import { listMediaLibrary } from "@/lib/content/media";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireAdmin("events");
  const media = await listMediaLibrary();
  return (
    <div>
      <h1 className="font-display text-3xl">New event</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        The public link is created from the title when you save. Copy it, or email it to guests, from the top of the
        saved event.
      </p>
      <EventForm media={media} />
    </div>
  );
}
