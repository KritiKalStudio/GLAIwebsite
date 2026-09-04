import { EventForm } from "@/components/admin/event-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  await requireAdmin("events");
  return (
    <div>
      <h1 className="font-display text-3xl">New event</h1>
      <EventForm />
    </div>
  );
}
