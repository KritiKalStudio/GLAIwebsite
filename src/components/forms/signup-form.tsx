"use client";

import Link from "next/link";
import { useActionState } from "react";
import { startSignupAction } from "@/app/actions/auth";
import { MembershipPlaceFields } from "@/components/forms/membership-place-fields";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextArea, TextInput } from "@/components/ui/field";

export function SignupForm({ role = "", referralCode = "" }: { role?: string; referralCode?: string }) {
  const [state, action, pending] = useActionState(startSignupAction, null);

  return (
    <form action={action} className="grid gap-4">
      {role ? <input type="hidden" name="role" value={role} /> : null}
      <FormError message={state?.error} />
      <Field label="Referral code" name="referralCode" hint="Optional. Use a member's code if someone invited you.">
        <TextInput
          id="referralCode"
          name="referralCode"
          defaultValue={referralCode}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="GLAI-XXXXXX"
        />
      </Field>
      <Field label="Full name" name="fullName">
        <TextInput id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="WhatsApp number" name="whatsapp" hint="Include country code, e.g. +2348012345678">
        <TextInput id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required />
      </Field>
      <Field label="Email" name="email" hint="We send your 4-digit confirmation code here.">
        <TextInput id="email" name="email" type="email" autoComplete="email" required />
      </Field>
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
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending code…" : "Continue to email confirmation"}
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
