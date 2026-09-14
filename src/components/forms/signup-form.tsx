"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { startSignupAction } from "@/app/actions/auth";
import { MembershipPlaceFields } from "@/components/forms/membership-place-fields";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextArea, TextInput } from "@/components/ui/field";

export function SignupForm({ role = "" }: { role?: string }) {
  const [state, action, pending] = useActionState(startSignupAction, null);
  const [otpChannel, setOtpChannel] = useState<"whatsapp" | "email">("whatsapp");

  return (
    <form action={action} className="grid gap-4">
      {role ? <input type="hidden" name="role" value={role} /> : null}
      <FormError message={state?.error} />
      <Field label="Full name" name="fullName">
        <TextInput id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="WhatsApp number" name="whatsapp" hint="Include country code, e.g. +2348012345678">
        <TextInput id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required />
      </Field>
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <fieldset className="rounded-lg border border-brand/10 bg-mist/50 p-4">
        <legend className="px-1 text-sm font-semibold">Where should we send your confirmation code?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-11 cursor-pointer items-center rounded-md border border-brand/15 bg-paper px-3 text-sm has-checked:border-brand has-checked:bg-brand has-checked:text-paper">
            <input
              type="radio"
              name="otpChannel"
              value="whatsapp"
              className="mr-2"
              checked={otpChannel === "whatsapp"}
              onChange={() => setOtpChannel("whatsapp")}
            />
            WhatsApp
          </label>
          <label className="flex min-h-11 cursor-pointer items-center rounded-md border border-brand/15 bg-paper px-3 text-sm has-checked:border-brand has-checked:bg-brand has-checked:text-paper">
            <input
              type="radio"
              name="otpChannel"
              value="email"
              className="mr-2"
              checked={otpChannel === "email"}
              onChange={() => setOtpChannel("email")}
            />
            Email
          </label>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" name="password" hint="At least 10 characters">
          <TextInput id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
        </Field>
        <Field label="Confirm password" name="confirmPassword">
          <TextInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
        </Field>
      </div>
      <Field label="Age" name="age">
        <TextInput id="age" name="age" type="number" min={13} max={120} inputMode="numeric" required />
      </Field>
      <MembershipPlaceFields />
      <Field label="Current address" name="currentAddress">
        <TextArea id="currentAddress" name="currentAddress" required />
      </Field>
      <Field label="Tribe" name="tribe">
        <TextInput id="tribe" name="tribe" required />
      </Field>
      <Field label="Education" name="education">
        <TextInput id="education" name="education" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Occupation" name="occupation">
          <TextInput id="occupation" name="occupation" required />
        </Field>
        <Field label="Organization" name="organization">
          <TextInput id="organization" name="organization" required />
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
        {pending ? "Sending code…" : otpChannel === "email" ? "Continue to email confirmation" : "Continue to WhatsApp confirmation"}
      </Button>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </form>
  );
}
