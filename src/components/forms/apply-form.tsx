"use client";

import { useActionState } from "react";
import { applyAmbassador } from "@/app/actions/ambassadors";
import { COUNTRIES } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, Select, TextArea, TextInput } from "@/components/ui/field";

const interests = [
  "dialogue",
  "youth",
  "education",
  "civic education",
  "humanitarian action",
  "campaigns",
  "media",
];

export function ApplyForm() {
  const [state, action, pending] = useActionState(applyAmbassador, null);

  if (state?.ok) {
    return (
      <FormSuccess message="We received your application. A confirmation has been sent to your email (or logged in sandbox if email is not configured)." />
    );
  }

  return (
    <form action={action} className="mx-auto grid max-w-2xl gap-5">
      <FormError message={state?.error} />
      <Field label="Full name" name="fullName">
        <TextInput id="fullName" name="fullName" required autoComplete="name" />
      </Field>
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Phone" name="phone">
        <TextInput id="phone" name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Country" name="countryCode">
        <Select id="countryCode" name="countryCode" required defaultValue="">
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="State / region" name="region">
        <TextInput id="region" name="region" />
      </Field>
      <Field label="Profession" name="profession">
        <TextInput id="profession" name="profession" />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Areas of interest</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {interests.map((interest) => (
            <label key={interest} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="areasOfInterest" value={interest} />
              {interest}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Why do you want to join?" name="whyJoin">
        <TextArea id="whyJoin" name="whyJoin" required />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Volunteer interests</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {["facilitation", "civic education", "logistics", "documentation", "care"].map((interest) => (
            <label key={interest} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="volunteerInterests" value={interest} />
              {interest}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="principles" className="mt-1" />
        <span>
          I agree to the Ambassador principles, code of conduct, and safeguarding expectations.
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit application"}
      </Button>
    </form>
  );
}
