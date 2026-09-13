import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { roles, users } from "@/db/schema";
import { optionalEnv } from "@/lib/env";

const adminPermissions = {
  content: true,
  programs: true,
  membership: true,
  events: true,
  donations: true,
  volunteers: true,
  users: true,
  settings: true,
};

async function ensureAdminRole() {
  const db = getDb();
  const [existing] = await db.select().from(roles).where(eq(roles.slug, "admin")).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(roles)
    .values({
      name: "Administrator",
      slug: "admin",
      permissions: adminPermissions,
    })
    .returning();
  return created;
}

/** If email+password match PRIMARY_ADMIN_* env, create or update that staff user. */
export async function syncPrimaryAdminFromEnv(email: string, password: string) {
  const primaryEmail = optionalEnv("PRIMARY_ADMIN_EMAIL")?.trim().toLowerCase();
  const primaryPassword = optionalEnv("PRIMARY_ADMIN_PASSWORD");
  const primaryName = optionalEnv("PRIMARY_ADMIN_NAME")?.trim() || "GLAI Admin";
  if (!primaryEmail || !primaryPassword) return null;
  if (email !== primaryEmail || password !== primaryPassword) return null;

  const db = getDb();
  const role = await ensureAdminRole();
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: primaryName,
        passwordHash,
        roleId: role.id,
        isActive: true,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      name: primaryName,
      passwordHash,
      roleId: role.id,
      emailVerifiedAt: new Date(),
      isActive: true,
    })
    .returning();
  return created;
}

export async function authenticateWithPassword(email: string, password: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user?.passwordHash && user.isActive && (await bcrypt.compare(password, user.passwordHash))) {
    return user;
  }
  return syncPrimaryAdminFromEnv(email, password);
}

export function safeAdminPath(next: string) {
  if (next.startsWith("/admin") && !next.startsWith("/admin/login")) return next;
  return "/admin";
}
