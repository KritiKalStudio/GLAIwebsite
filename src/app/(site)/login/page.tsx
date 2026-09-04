import { LoginForm } from "@/components/forms/login-form";
import { Section } from "@/components/blocks/section";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; pending?: string }>;
}) {
  const { next, pending } = await searchParams;
  return (
    <Section className="max-w-md">
      <h1 className="font-display text-3xl">Sign in</h1>
      {pending ? (
        <p className="mt-3 text-sm text-muted">
          Your application is still under review. Portal access opens after approval.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Approved ambassadors and staff use this form. Applications do not create a login until they are approved.
        </p>
      )}
      <div className="mt-8">
        <LoginForm next={next ?? ""} />
      </div>
    </Section>
  );
}
