import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/admin/staff-login-form";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { safeAdminPath } from "@/lib/primary-admin";

export const metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeAdminPath(next ?? "/admin");
  const user = await getSessionUser();
  if (isAdmin(user)) redirect(destination);

  return (
    <div className="flex min-h-screen flex-col bg-brand text-paper">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:py-16">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/glai-mark.png"
            width={48}
            height={40}
            alt=""
            className="h-10 w-12 rounded-full bg-paper object-cover object-top"
          />
          <span>
            <strong className="font-display text-3xl font-bold tracking-[-.06em]">GLAI</strong>
            <small className="mt-0.5 block text-[10px] font-semibold tracking-[.18em] text-paper/55 uppercase">
              Staff portal
            </small>
          </span>
        </Link>
        <div className="mt-8 rounded-xl bg-paper p-4 text-ink shadow-[0_24px_60px_-32px_rgba(0,0,0,.55)] sm:mt-10 sm:rounded-2xl sm:p-6">
          <h1 className="font-display text-2xl text-brand">Sign in to the console</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Use the administrator email and password for this site. Member accounts cannot open this
            portal.
          </p>
          <StaffLoginForm next={destination} />
        </div>
        <p className="mt-8 text-sm text-paper/70">
          Love Ambassadors sign in on the{" "}
          <Link href="/login" className="font-semibold text-sunshine hover:text-paper">
            member portal
          </Link>
          .
        </p>
        <Link href="/" className="mt-3 text-sm text-paper/55 hover:text-paper">
          ← Back to the public site
        </Link>
      </div>
    </div>
  );
}
