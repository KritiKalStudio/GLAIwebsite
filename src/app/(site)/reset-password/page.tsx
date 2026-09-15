import { ResetForm } from "@/components/forms/reset-form";
import { AuthPanel } from "@/components/blocks/section";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthPanel>
      <h1 className="text-center font-display text-2xl sm:text-3xl">Choose a new password</h1>
      <div className="mt-5 sm:mt-8">
        <ResetForm token={token ?? ""} />
      </div>
    </AuthPanel>
  );
}
