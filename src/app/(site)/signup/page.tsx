import { redirect } from "next/navigation";
import { SignupForm } from "@/components/forms/signup-form";
import { AuthPanel } from "@/components/blocks/section";
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
    <AuthPanel className="max-w-lg">
      <h1 className="text-center font-display text-3xl sm:text-4xl">Create your membership</h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted">
        Choose whether to receive your 4-digit confirmation code by WhatsApp or email. Confirm it and you are signed in
        — no review wait.
      </p>
      {selected ? (
        <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-center text-sm">
          After confirmation we will assign you to <strong>{selected.title}</strong> if a slot is still open.
        </p>
      ) : null}
      <div className="mt-8">
        <SignupForm role={selected?.slug ?? ""} />
      </div>
    </AuthPanel>
  );
}
