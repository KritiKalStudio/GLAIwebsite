import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SignupConfirmForm } from "@/components/forms/signup-confirm-form";
import { Section } from "@/components/blocks/section";
import { getDb } from "@/db";
import { signupChallenges } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Confirm your number", robots: { index: false, follow: false } };

export default async function SignupConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; dev?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const { id, dev } = await searchParams;
  if (!id) notFound();
  const [challenge] = await getDb().select().from(signupChallenges).where(eq(signupChallenges.id, id)).limit(1);
  if (!challenge) notFound();

  return (
    <Section className="max-w-md px-4">
      <h1 className="font-display text-3xl">Check WhatsApp</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Enter the 4-digit code we sent to confirm that your WhatsApp number is active.
      </p>
      <div className="mt-8">
        <SignupConfirmForm id={id} devCode={process.env.NODE_ENV === "production" ? undefined : dev} />
      </div>
    </Section>
  );
}
