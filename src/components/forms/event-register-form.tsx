"use client";

import { useActionState } from "react";
import { registerForEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/field";

export function EventRegisterForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(registerForEvent, null);
  if (state?.ok) {
    return (
      <FormSuccess
        message={
          state.waitlist
            ? "The event is full. You are on the waitlist and will be notified if a place opens."
            : "You are registered. A confirmation has been sent to your email."
        }
      />
    );
  }
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-brand/10 bg-paper p-5">
      <input type="hidden" name="eventId" value={eventId} />
      <FormError message={state?.error} />
      <Field label="Name" name="name">
        <TextInput id="name" name="name" required />
      </Field>
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" required />
      </Field>
      <Field label="Phone" name="phone">
        <TextInput id="phone" name="phone" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Registering…" : "Register"}
      </Button>
    </form>
  );
}
