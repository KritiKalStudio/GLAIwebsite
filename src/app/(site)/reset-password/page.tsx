import { ResetForm } from "@/components/forms/reset-form";
import { Section } from "@/components/blocks/section";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <Section className="max-w-md">
      <h1 className="font-display text-3xl">Choose a new password</h1>
      <div className="mt-8">
        <ResetForm token={token ?? ""} />
      </div>
    </Section>
  );
}
