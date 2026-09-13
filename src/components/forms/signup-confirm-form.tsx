"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmSignupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, TextInput } from "@/components/ui/field";

export function SignupConfirmForm({ id, devCode }: { id: string; devCode?: string }) {
  const [state, action, pending] = useActionState(confirmSignupAction, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <FormError message={state?.error} />
      {devCode ? (
        <p className="rounded-lg bg-mist px-3 py-2 text-sm text-muted">
          WhatsApp is not configured on this machine. Use code <strong className="text-ink">{devCode}</strong> to
          continue.
        </p>
      ) : null}
      <Field label="4-digit code" name="code">
        <TextInput
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={4}
          className="text-center text-2xl tracking-[0.4em]"
        />
      </Field>
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Confirming…" : "Confirm and open dashboard"}
      </Button>
      <p className="text-sm text-muted">
        Wrong number?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Start again
        </Link>
      </p>
    </form>
  );
}
