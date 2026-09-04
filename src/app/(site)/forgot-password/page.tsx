import { requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Section } from "@/components/blocks/section";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <Section className="max-w-md">
      <h1 className="font-display text-3xl">Reset password</h1>
      <p className="mt-3 text-sm text-muted">
        If an account exists, we will send a reset link. In sandbox mode the link is written to the notification log.
      </p>
      <form action={requestPasswordReset} className="mt-8 grid gap-4">
        <Field label="Email" name="email">
          <TextInput id="email" name="email" type="email" required />
        </Field>
        <Button type="submit">Send reset link</Button>
      </form>
    </Section>
  );
}
