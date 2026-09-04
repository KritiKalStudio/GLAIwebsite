"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, FormSuccess, TextInput } from "@/components/ui/field";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  if (state?.ok) {
    return (
      <div>
        <FormSuccess message="Password updated." />
        <Link href="/login" className="mt-4 inline-block text-sm text-accent">
          Sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <FormError message={state?.error} />
      <Field label="New password" name="password">
        <TextInput id="password" name="password" type="password" required minLength={10} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
