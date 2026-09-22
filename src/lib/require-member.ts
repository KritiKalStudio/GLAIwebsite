import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth";

export async function requireMember(): Promise<SessionUser & { ambassadorId: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (!user.ambassadorId) {
    if (user.roleSlug) redirect("/admin");
    redirect("/signup");
  }
  return user as SessionUser & { ambassadorId: string };
}
