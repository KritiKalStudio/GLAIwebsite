"use client";

import { useState } from "react";
import { submitContact } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/field";

export function ContactForm() {
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, setPending] = useState(false);

  if (state?.ok) {
    return <FormSuccess message="Message received. We will reply to the address you gave." />;
  }

  return (
    <form
      className="grid gap-4"
      action={async (formData) => {
        setPending(true);
        const result = await submitContact(formData);
        setState(result);
        setPending(false);
      }}
    >
      <FormError message={state?.error} />
      <Field label="Name" name="name">
        <TextInput id="name" name="name" required />
      </Field>
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" required />
      </Field>
      <Field label="Topic" name="topic">
        <Select id="topic" name="topic" defaultValue="general">
          <option value="general">General</option>
          <option value="press">Press</option>
          <option value="partnership">Partnership</option>
          <option value="safeguarding">Safeguarding</option>
          <option value="privacy">Privacy / deletion</option>
        </Select>
      </Field>
      <Field label="Message" name="body">
        <TextArea id="body" name="body" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
