"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { ambassadors, passwordResetTokens, users } from "@/db/schema";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  hashToken,
  verifyPassword,
} from "@/lib/auth";
import { sendTemplatedEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (!user?.passwordHash || !user.isActive) {
    return { error: "Those details did not match an active account." };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Those details did not match an active account." };

  const [ambassador] = await getDb()
    .select()
    .from(ambassadors)
    .where(eq(ambassadors.userId, user.id))
    .limit(1);

  await createSession(user.id);

  if (next.startsWith("/")) redirect(next);
  if (user.roleId) redirect("/admin");
  if (ambassador && (ambassador.status === "active" || ambassador.status === "approved")) {
    redirect("/dashboard");
  }
  redirect("/login?pending=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomBytes(32).toString("hex");
    await getDb().insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    await sendTemplatedEmail({
      type: "application_approved",
      to: user.email,
      vars: {
        name: user.name,
        resetUrl: `${getSiteUrl()}/reset-password?token=${token}`,
      },
    });
  }
}

export async function resetPasswordAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) {
    return { error: "Choose a password of at least 10 characters." };
  }
  const tokenHash = hashToken(token);
  const [row] = await getDb()
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }
  await getDb()
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, row.userId));
  await getDb().delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id));
  return { ok: true };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
