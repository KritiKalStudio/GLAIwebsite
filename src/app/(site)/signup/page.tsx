import { redirect } from "next/navigation";
import { SignupForm } from "@/components/forms/signup-form";
import { Section } from "@/components/blocks/section";
import { getSessionUser } from "@/lib/auth";
import { getPublishedOpportunities } from "@/lib/content/volunteers";

export const metadata = { title: "Sign up", robots: { index: false, follow: false } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.roleSlug) redirect("/admin");
  if (user) redirect("/dashboard");
  const { role } = await searchParams;
  const roles = await getPublishedOpportunities();
  const selected = roles.find((item) => item.slug === role);

  return (
    <Section className="max-w-lg px-4">
      <h1 className="font-display text-3xl sm:text-4xl">Create your membership</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        After you submit, we send a 4-digit code to WhatsApp. Confirm it and you are signed in — no review wait.
      </p>
      {selected ? (
        <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-sm">
          After confirmation we will assign you to <strong>{selected.title}</strong> if a slot is still open.
        </p>
      ) : null}
      <div className="mt-8">
        <SignupForm role={selected?.slug ?? ""} />
      </div>
    </Section>
  );
}
