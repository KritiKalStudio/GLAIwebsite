"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/field";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <FormError message={state?.error} />
      <Field label="Email" name="email">
        <TextInput id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" name="password">
        <TextInput id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm">
        <Link href="/forgot-password" className="text-accent">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Sign up
        </Link>
      </p>
    </form>
  );
}
