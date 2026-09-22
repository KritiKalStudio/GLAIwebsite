import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MemberShell } from "@/components/dashboard/member-shell";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { requireMember } from "@/lib/require-member";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMember();
  const [profile] = await getDb()
    .select({ fullName: ambassadors.fullName })
    .from(ambassadors)
    .where(eq(ambassadors.id, user.ambassadorId))
    .limit(1);
  if (!profile) redirect("/signup");

  return <MemberShell name={profile.fullName}>{children}</MemberShell>;
}
