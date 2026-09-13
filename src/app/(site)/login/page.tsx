import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { Section } from "@/components/blocks/section";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (next?.startsWith("/admin")) {
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  return (
    <Section className="max-w-md px-4">
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-3 text-sm text-muted">
        Members use this form. Staff sign in on the{" "}
        <a href="/admin/login" className="font-semibold text-accent">
          staff portal
        </a>
        .
      </p>
      <div className="mt-8">
        <LoginForm next={next ?? ""} />
      </div>
    </Section>
  );
}
