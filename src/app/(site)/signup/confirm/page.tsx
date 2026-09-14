import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SignupConfirmForm } from "@/components/forms/signup-confirm-form";
import { AuthPanel } from "@/components/blocks/section";
import { getDb } from "@/db";
import { signupChallenges } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Confirm your code", robots: { index: false, follow: false } };

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
  const channel = challenge.payload.otpChannel === "email" ? "email" : "whatsapp";

  return (
    <AuthPanel>
      <h1 className="text-center font-display text-3xl">
        {channel === "email" ? "Check your email" : "Check WhatsApp"}
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted">
        {channel === "email"
          ? "Enter the 4-digit code we sent to confirm that your email address is active."
          : "Enter the 4-digit code we sent to confirm that your WhatsApp number is active."}
      </p>
      <div className="mt-8">
        <SignupConfirmForm
          id={id}
          channel={channel}
          devCode={process.env.NODE_ENV === "production" ? undefined : dev}
        />
      </div>
    </AuthPanel>
  );
}
