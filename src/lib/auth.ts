import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/db";
import { ambassadors, roles, sessions, users } from "@/db/schema";
import { optionalEnv, requiredEnv } from "@/lib/env";

const COOKIE_NAME = "glai_session";
const SESSION_DAYS = 14;

function secretKey() {
  return new TextEncoder().encode(requiredEnv("AUTH_SECRET"));
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = getDb();
  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });

  const token = await new SignJWT({ sid: sessionId, sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      if (typeof payload.sid === "string") {
        await getDb().delete(sessions).where(eq(sessions.id, payload.sid));
      }
    } catch {
      // ignore invalid tokens
    }
  }
  jar.delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roleSlug: string | null;
  permissions: Record<string, boolean>;
  ambassadorStatus: string | null;
  ambassadorId: string | null;
};

export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sid !== "string" || typeof payload.sub !== "string") {
      return null;
    }
    const db = getDb();
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, payload.sid))
      .limit(1);
    if (!session || session.expiresAt < new Date()) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!user || !user.isActive) return null;

    let roleSlug: string | null = null;
    let permissions: Record<string, boolean> = {};
    if (user.roleId) {
      const [role] = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);
      roleSlug = role?.slug ?? null;
      permissions = (role?.permissions ?? {}) as Record<string, boolean>;
    }

    const [ambassador] = await db
      .select()
      .from(ambassadors)
      .where(eq(ambassadors.userId, user.id))
      .limit(1);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleSlug,
      permissions,
      ambassadorStatus: ambassador?.status ?? null,
      ambassadorId: ambassador?.id ?? null,
    };
  } catch {
    return null;
  }
});

export function isAdmin(user: SessionUser | null): user is SessionUser {
  if (!user) return false;
  return user.roleSlug === "admin" || user.roleSlug === "editor" || Object.values(user.permissions).some(Boolean);
}

export function hasPermission(user: SessionUser | null, key: string) {
  if (!user) return false;
  if (user.roleSlug === "admin") return true;
  return Boolean(user.permissions[key]);
}

/** The primary administrator is configured outside the database and cannot be demoted in the UI. */
export function isPrimaryAdmin(user: SessionUser | null) {
  const primaryEmail = optionalEnv("PRIMARY_ADMIN_EMAIL")?.trim().toLowerCase();
  return Boolean(primaryEmail && user?.roleSlug === "admin" && user.email.toLowerCase() === primaryEmail);
}
