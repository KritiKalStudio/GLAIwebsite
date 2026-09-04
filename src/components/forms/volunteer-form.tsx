"use client";

import { useActionState } from "react";
import { applyVolunteer } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/field";

export function VolunteerForm({
  opportunities,
}: {
  opportunities: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(applyVolunteer, null);
  if (state?.ok) {
    return <FormSuccess message="Thank you. We received your volunteer application." />;
  }
  return (
    <form action={action} className="grid max-w-xl gap-4">
      <h3 className="font-display text-2xl">Apply</h3>
      <FormError message={state?.error} />
      <Field label="Full name" name="fullName">
        <TextInput id="fullName" name="fullName" required />
      </Field>
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" required />
      </Field>
      <Field label="Phone" name="phone">
        <TextInput id="phone" name="phone" />
      </Field>
      <Field label="Country" name="country">
        <TextInput id="country" name="country" required />
      </Field>
      <Field label="Role" name="opportunityId">
        <Select id="opportunityId" name="opportunityId" defaultValue="">
          <option value="">No specific role</option>
          {opportunities.map((role) => (
            <option key={role.id} value={role.id}>
              {role.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="How would you like to help?" name="message">
        <TextArea id="message" name="message" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
}
