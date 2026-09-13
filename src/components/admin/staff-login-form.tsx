"use client";

import Link from "next/link";
import { useActionState } from "react";
import { staffLoginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/field";

export function StaffLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(staffLoginAction, null);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next} />
      <FormError message={state?.error} />
      <Field label="Work email" name="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
        />
      </Field>
      <Field label="Password" name="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Link href="/forgot-password" className="text-center text-sm text-accent">
        Forgot password?
      </Link>
    </form>
  );
}
