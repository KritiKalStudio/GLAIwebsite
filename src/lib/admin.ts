import { redirect } from "next/navigation";
import { getSessionUser, hasPermission, isAdmin, type SessionUser } from "@/lib/auth";

export async function requireAdmin(permission?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!isAdmin(user)) redirect("/admin/login?next=/admin");
  if (permission && !hasPermission(user, permission)) redirect("/admin");
  return user;
}
