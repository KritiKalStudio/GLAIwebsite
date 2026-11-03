"use client";

import { useActionState } from "react";
import { registerForEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextArea, TextInput } from "@/components/ui/field";
import type { EventCustomField } from "@/db/schema";

export function EventRegisterForm({ eventId, fields }: { eventId: string; fields: EventCustomField[] }) {
  const [state, action, pending] = useActionState(registerForEvent, null);
  const success = state?.ok
    ? state.response === "no"
      ? "You told us you cannot attend."
      : state.response === "maybe"
        ? "You told us you might attend."
        : state.waitlist
          ? "You want to attend. The event is full, so you are on the waitlist."
          : "You told us you will attend."
    : null;

  return (
    <form action={action} className="grid gap-3 rounded-lg border border-brand/10 bg-paper p-5">
      <input type="hidden" name="eventId" value={eventId} />
      {success ? (
        <FormSuccess
          message={
            state?.emailFailed
              ? `${success} We saved your response, but the confirmation email could not be sent.`
              : `${state?.updated ? "Your response was updated. " : ""}${success} A confirmation has been sent to your email.`
          }
        />
      ) : null}
      <FormError message={state?.error} />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-ink">Will you attend?</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="rsvp" value="yes" required />
          Yes, I will attend
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="rsvp" value="maybe" />
          I might attend
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="rsvp" value="no" />
          No, I cannot attend
        </label>
      </fieldset>
      <Field label="Name" name="name">
        <TextInput id="name" name="name" required maxLength={120} />
      </Field>
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" required />
      </Field>
      <Field label="Phone" name="phone" hint="Optional.">
        <TextInput id="phone" name="phone" maxLength={40} />
      </Field>
      {fields.map((field) =>
        field.kind === "text" ? (
          <Field key={field.id} label={field.label} name={`field:${field.id}`}>
            <TextArea id={`field:${field.id}`} name={`field:${field.id}`} required={field.required} maxLength={2000} />
          </Field>
        ) : field.multiple ? (
          <fieldset key={field.id} className="grid gap-2">
            <legend className="text-sm font-semibold text-ink">
              {field.label}
              {field.required ? "" : " (optional)"}
            </legend>
            {field.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={`field:${field.id}`} value={option} />
                {option}
              </label>
            ))}
          </fieldset>
        ) : (
          <fieldset key={field.id} className="grid gap-2">
            <legend className="text-sm font-semibold text-ink">
              {field.label}
              {field.required ? "" : " (optional)"}
            </legend>
            {field.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input type="radio" name={`field:${field.id}`} value={option} required={field.required} />
                {option}
              </label>
            ))}
          </fieldset>
        ),
      )}
      <p className="text-xs text-muted">Use the same email address to change your answer later.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Confirm response"}
      </Button>
    </form>
  );
}
