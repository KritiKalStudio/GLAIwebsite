import { requestPasswordReset } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { AuthPanel } from "@/components/blocks/section";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel>
      <h1 className="text-center font-display text-2xl sm:text-3xl">Reset password</h1>
      <p className="mt-3 text-center text-sm text-muted">
        If an account exists, we will send a reset link to that email address.
      </p>
      <form action={requestPasswordReset} className="mt-5 grid gap-4 sm:mt-8">
        <Field label="Email" name="email">
          <TextInput id="email" name="email" type="email" required />
        </Field>
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthPanel>
  );
}
