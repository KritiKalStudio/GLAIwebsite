"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { CACHE_TAGS, revalidateContent } from "@/lib/cache";
import {
  ambassadors,
  campaigns,
  contactMessages,
  donations,
  eventRegistrations,
  events,
  faqItems,
  impactStats,
  mediaAssets,
  newsletterSubscribers,
  notificationTemplates,
  pageBlocks,
  pages,
  people,
  programs,
  projects,
  roles,
  sessions,
  siteSettings,
  stories,
  users,
  volunteerApplications,
  volunteerOpportunities,
  youtubeVideos,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { getSessionUser, hashPassword, hasPermission, isAdmin, isPrimaryAdmin } from "@/lib/auth";
import { putObject } from "@/lib/r2";
import { sendTemplatedEmail } from "@/lib/email";
import { sanitizeRichText } from "@/lib/rich-text";
import { rewriteLegacyApplyHref, rewriteNavHrefs } from "@/lib/nav";
import { fetchYoutubeOEmbed, youtubeIdFromUrl, youtubeThumbnailUrl, youtubeWatchUrl } from "@/lib/youtube";

async function actor(permission?: string) {
  const user = await getSessionUser();
  if (!isAdmin(user)) redirect("/login");
  if (permission && !hasPermission(user, permission)) {
    throw new Error("You do not have permission for this action.");
  }
  return user;
}

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const adminPermissionKeys = ["content", "programs", "membership", "events", "donations", "volunteers", "users", "settings"] as const;

function readAdminPermissions(formData: FormData) {
  return Object.fromEntries(adminPermissionKeys.map((key) => [key, formData.get(`permission-${key}`) === "on"]));
}

async function primaryAdminActor() {
  const user = await actor("users");
  if (!isPrimaryAdmin(user)) {
    throw new Error("Only the primary administrator can manage administrator access.");
  }
  return user;
}

export async function savePage(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug"),
    locale: str(formData, "locale") || "en",
    title: str(formData, "title"),
    description: str(formData, "description"),
    status: str(formData, "status") as "draft" | "preview" | "published" | "archived",
    seoTitle: str(formData, "seoTitle") || null,
    seoDescription: str(formData, "seoDescription") || null,
    updatedAt: new Date(),
    publishedAt: str(formData, "status") === "published" ? new Date() : null,
  };
  if (id) {
    await getDb().update(pages).set(values).where(eq(pages.id, id));
    await recordAudit({ actorId: user.id, action: "page.update", entityType: "page", entityId: id });
    revalidateContent(CACHE_TAGS.pages);
    revalidatePath("/admin/pages");
    redirect(`/admin/pages/${id}`);
  }
  const [created] = await getDb().insert(pages).values(values).returning();
  await recordAudit({ actorId: user.id, action: "page.create", entityType: "page", entityId: created.id });
  revalidateContent(CACHE_TAGS.pages);
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${created.id}`);
}

export async function savePageBlocks(formData: FormData) {
  const user = await actor("content");
  const pageId = str(formData, "pageId");
  const raw = str(formData, "blocks");
  let parsed: { type: string; data: Record<string, unknown> }[] = [];
  try {
    parsed = JSON.parse(raw) as { type: string; data: Record<string, unknown> }[];
  } catch {
    throw new Error("Blocks must be valid JSON.");
  }
  await getDb().delete(pageBlocks).where(eq(pageBlocks.pageId, pageId));
  if (parsed.length) {
    await getDb().insert(pageBlocks).values(
      parsed.map((block, index) => ({
        pageId,
        type: block.type as never,
        sortOrder: index,
        data: block.data ?? {},
      })),
    );
  }
  await recordAudit({ actorId: user.id, action: "page.blocks", entityType: "page", entityId: pageId });
  revalidateContent(CACHE_TAGS.pages);
  revalidatePath("/");
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${pageId}`);
}

export async function savePageRichContent(formData: FormData) {
  const user = await actor("content");
  const pageId = str(formData, "pageId");
  const blockId = str(formData, "blockId");
  if (!pageId) throw new Error("Page identifier is required.");
  const data = { body: sanitizeRichText(str(formData, "body")) };
  if (blockId) {
    await getDb().update(pageBlocks).set({ data }).where(eq(pageBlocks.id, blockId));
  } else {
    const existing = await getDb().select({ sortOrder: pageBlocks.sortOrder }).from(pageBlocks).where(eq(pageBlocks.pageId, pageId)).orderBy(pageBlocks.sortOrder);
    await getDb().insert(pageBlocks).values({ pageId, type: "rich_text", sortOrder: (existing.at(-1)?.sortOrder ?? -1) + 1, data });
  }
  await recordAudit({ actorId: user.id, action: "page.rich_content", entityType: "page", entityId: pageId });
  revalidateContent(CACHE_TAGS.pages);
  revalidatePath("/");
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${pageId}`);
}

export async function saveStory(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  const involvesMinors = formData.get("involvesMinors") === "on";
  const safeguardingReviewed = formData.get("safeguardingReviewed") === "on";
  const status = str(formData, "status") as "draft" | "preview" | "published" | "archived";
  if (status === "published" && involvesMinors && !safeguardingReviewed) {
    throw new Error(
      "Stories involving children or vulnerable people cannot be published until safeguarding review is confirmed.",
    );
  }
  const values = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    excerpt: str(formData, "excerpt"),
    body: sanitizeRichText(str(formData, "body")),
    category: str(formData, "category") as never,
    status,
    authorName: str(formData, "authorName") || null,
    featuredImageUrl: str(formData, "featuredImageUrl") || null,
    seoTitle: str(formData, "seoTitle") || null,
    seoDescription: str(formData, "seoDescription") || null,
    involvesMinors,
    safeguardingReviewed,
    safeguardingReviewedAt: safeguardingReviewed ? new Date() : null,
    safeguardingReviewedById: safeguardingReviewed ? user.id : null,
    publishedAt: status === "published" ? new Date() : null,
    updatedAt: new Date(),
  };
  if (id) {
    await getDb().update(stories).set(values).where(eq(stories.id, id));
    await recordAudit({ actorId: user.id, action: "story.update", entityType: "story", entityId: id });
    revalidateContent(CACHE_TAGS.stories);
    revalidatePath("/stories");
    redirect(`/admin/stories/${id}`);
  }
  const [created] = await getDb().insert(stories).values(values).returning();
  await recordAudit({ actorId: user.id, action: "story.create", entityType: "story", entityId: created.id });
  revalidateContent(CACHE_TAGS.stories);
  redirect(`/admin/stories/${created.id}`);
}

export async function saveProgram(formData: FormData) {
  const user = await actor("programs");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    shortDescription: str(formData, "shortDescription"),
    purpose: str(formData, "purpose"),
    whoCanParticipate: str(formData, "whoCanParticipate") || null,
    process: str(formData, "process") || null,
    outcomes: str(formData, "outcomes") || null,
    applyCtaLabel: str(formData, "applyCtaLabel") || null,
    applyHref: rewriteLegacyApplyHref(str(formData, "applyHref") || "") || null,
    featuredImageUrl: str(formData, "featuredImageUrl") || null,
    youtubeUrl: str(formData, "youtubeUrl") || null,
    startsAt: str(formData, "startsAt") ? new Date(str(formData, "startsAt")) : null,
    endsAt: str(formData, "endsAt") ? new Date(str(formData, "endsAt")) : null,
    goalAmount: str(formData, "goalAmount") || null,
    currency: str(formData, "currency") || "NGN",
    status: str(formData, "status") as never,
    updatedAt: new Date(),
  };
  let programId = id;
  if (id) {
    await getDb().update(programs).set(values).where(eq(programs.id, id));
    await recordAudit({ actorId: user.id, action: "program.update", entityType: "program", entityId: id });
  } else {
    const [created] = await getDb().insert(programs).values(values).returning();
    programId = created.id;
    await recordAudit({ actorId: user.id, action: "program.create", entityType: "program", entityId: created.id });
  }
  const [program] = await getDb().select().from(programs).where(eq(programs.id, programId)).limit(1);
  if (program) {
    const campaignValues = {
      slug: program.slug,
      name: program.name,
      description: program.shortDescription,
      programId: program.id,
      goalAmount: program.goalAmount,
      currency: program.currency,
      featuredImageUrl: program.featuredImageUrl,
      startsAt: program.startsAt,
      endsAt: program.endsAt,
      status: program.status === "published" ? ("published" as const) : ("draft" as const),
      updatedAt: new Date(),
    };
    const [existingCampaign] = await getDb()
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.programId, program.id))
      .limit(1);
    if (existingCampaign) {
      await getDb().update(campaigns).set(campaignValues).where(eq(campaigns.id, existingCampaign.id));
    } else {
      await getDb()
        .insert(campaigns)
        .values(campaignValues)
        .onConflictDoUpdate({ target: campaigns.slug, set: campaignValues });
    }
  }
  revalidateContent(CACHE_TAGS.programs, CACHE_TAGS.donations);
  redirect(`/admin/programs/${programId}`);
}

export async function deleteProgram(formData: FormData) {
  const user = await actor("programs");
  const id = str(formData, "id");
  if (!id) return;
  await getDb().delete(programs).where(eq(programs.id, id));
  await recordAudit({ actorId: user.id, action: "program.delete", entityType: "program", entityId: id });
  revalidateContent(CACHE_TAGS.programs, CACHE_TAGS.donations);
  redirect("/admin/programs");
}

export async function saveProject(formData: FormData) {
  const user = await actor("programs");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    focusArea: str(formData, "focusArea") as never,
    location: str(formData, "location"),
    country: str(formData, "country"),
    countryCode: str(formData, "countryCode"),
    challenge: str(formData, "challenge"),
    actionsTaken: str(formData, "actionsTaken"),
    featuredImageUrl: str(formData, "featuredImageUrl") || null,
    status: str(formData, "status") as never,
    lastUpdated: new Date(),
  };
  if (id) {
    await getDb().update(projects).set(values).where(eq(projects.id, id));
    await recordAudit({ actorId: user.id, action: "project.update", entityType: "project", entityId: id });
    revalidateContent(CACHE_TAGS.projects);
    redirect(`/admin/projects/${id}`);
  }
  const [created] = await getDb().insert(projects).values(values).returning();
  await recordAudit({ actorId: user.id, action: "project.create", entityType: "project", entityId: created.id });
  revalidateContent(CACHE_TAGS.projects);
  redirect(`/admin/projects/${created.id}`);
}

export async function saveEvent(formData: FormData) {
  const user = await actor("events");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    startsAt: new Date(str(formData, "startsAt")),
    endsAt: str(formData, "endsAt") ? new Date(str(formData, "endsAt")) : null,
    timezone: str(formData, "timezone") || "Africa/Lagos",
    city: str(formData, "city") || null,
    country: str(formData, "country") || null,
    venueName: str(formData, "venueName") || null,
    isOnline: formData.get("isOnline") === "on",
    onlineUrl: str(formData, "onlineUrl") || null,
    capacity: str(formData, "capacity") ? Number(str(formData, "capacity")) : null,
    registrationType: str(formData, "registrationType") as never,
    featuredImageUrl: str(formData, "featuredImageUrl") || null,
    youtubeUrl: str(formData, "youtubeUrl") || null,
    postEventReport: str(formData, "postEventReport") || null,
    status: str(formData, "status") as never,
    updatedAt: new Date(),
  };
  if (id) {
    await getDb().update(events).set(values).where(eq(events.id, id));
    await recordAudit({ actorId: user.id, action: "event.update", entityType: "event", entityId: id });
    revalidateContent(CACHE_TAGS.events);
    redirect(`/admin/events/${id}`);
  }
  const [created] = await getDb().insert(events).values(values).returning();
  await recordAudit({ actorId: user.id, action: "event.create", entityType: "event", entityId: created.id });
  revalidateContent(CACHE_TAGS.events);
  redirect(`/admin/events/${created.id}`);
}

export async function saveImpactStat(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  await getDb()
    .update(impactStats)
    .set({
      label: str(formData, "label"),
      valueDisplay: str(formData, "valueDisplay"),
      source: str(formData, "source") || null,
      lastUpdated: new Date(),
    })
    .where(eq(impactStats.id, id));
  await recordAudit({ actorId: user.id, action: "stat.update", entityType: "impact_stat", entityId: id });
  revalidateContent(CACHE_TAGS.impact);
  revalidatePath("/admin/impact");
  revalidatePath("/");
}

export async function saveSettings(formData: FormData) {
  const user = await actor("settings");
  const headerCtas = JSON.parse(str(formData, "headerCtas") || "{}") as {
    donateLabel?: string;
    donateHref?: string;
    joinLabel?: string;
    joinHref?: string;
  };
  const footer = JSON.parse(str(formData, "footer") || "{}") as {
    tagline?: string;
    columns?: { title: string; links: { label: string; href: string }[] }[];
    legalLinks?: { label: string; href: string }[];
    newsletterLabel?: string;
    newsletterPlaceholder?: string;
    copyright?: string;
  };
  await getDb()
    .update(siteSettings)
    .set({
      orgName: str(formData, "orgName"),
      tagline: str(formData, "tagline"),
      languages: JSON.parse(str(formData, "languages") || "[]"),
      navigation: rewriteNavHrefs(JSON.parse(str(formData, "navigation") || "[]")),
      headerCtas: {
        ...headerCtas,
        donateHref: rewriteLegacyApplyHref(headerCtas.donateHref ?? "/donate"),
        joinHref: rewriteLegacyApplyHref(headerCtas.joinHref ?? "/love-ambassadors"),
      },
      footer: {
        ...footer,
        columns: (footer.columns ?? []).map((column) => ({
          ...column,
          links: (column.links ?? []).map((link) => ({
            ...link,
            href: rewriteLegacyApplyHref(link.href),
          })),
        })),
        legalLinks: (footer.legalLinks ?? []).map((link) => ({
          ...link,
          href: rewriteLegacyApplyHref(link.href),
        })),
      },
      contact: JSON.parse(str(formData, "contact") || "{}"),
      defaultSeo: JSON.parse(str(formData, "defaultSeo") || "{}"),
      designTokens: JSON.parse(str(formData, "designTokens") || "{}"),
      payment: {
        bank: {
          bankName: str(formData, "bankName"),
          accountName: str(formData, "bankAccountName"),
          accountNumber: str(formData, "bankAccountNumber"),
          instructions: str(formData, "bankInstructions"),
        },
      },
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, "default"));
  await recordAudit({ actorId: user.id, action: "settings.update", entityType: "settings", entityId: "default" });
  revalidateContent(CACHE_TAGS.settings);
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function saveNotificationTemplate(formData: FormData) {
  const user = await actor("settings");
  const id = str(formData, "id");
  await getDb()
    .update(notificationTemplates)
    .set({
      subject: str(formData, "subject"),
      body: str(formData, "body"),
      updatedAt: new Date(),
    })
    .where(eq(notificationTemplates.id, id));
  await recordAudit({
    actorId: user.id,
    action: "notification.update",
    entityType: "notification_template",
    entityId: id,
  });
  revalidatePath("/admin/notifications");
}

export async function saveCampaign(formData: FormData) {
  const user = await actor("donations");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    description: str(formData, "description"),
    currency: str(formData, "currency") || "NGN",
    status: str(formData, "status") as never,
    updatedAt: new Date(),
  };
  if (id) {
    await getDb().update(campaigns).set(values).where(eq(campaigns.id, id));
    revalidateContent(CACHE_TAGS.donations);
    redirect("/admin/donations");
  }
  await getDb().insert(campaigns).values(values);
  await recordAudit({ actorId: user.id, action: "campaign.save", entityType: "campaign" });
  revalidateContent(CACHE_TAGS.donations);
  redirect("/admin/donations");
}

export async function acceptVolunteer(formData: FormData) {
  const user = await actor("volunteers");
  const id = str(formData, "id");
  const [row] = await getDb()
    .select()
    .from(volunteerApplications)
    .where(eq(volunteerApplications.id, id))
    .limit(1);
  if (!row) return;
  await getDb()
    .update(volunteerApplications)
    .set({ status: "accepted" })
    .where(eq(volunteerApplications.id, id));
  await sendTemplatedEmail({
    type: "volunteer_accepted",
    to: row.email,
    vars: { name: row.fullName, opportunity: "the role you applied for" },
  });
  await recordAudit({ actorId: user.id, action: "volunteer.accept", entityType: "volunteer", entityId: id });
  revalidatePath("/admin/volunteers");
}

export async function declineVolunteer(formData: FormData) {
  const user = await actor("volunteers");
  const id = str(formData, "id");
  await getDb()
    .update(volunteerApplications)
    .set({ status: "declined" })
    .where(eq(volunteerApplications.id, id));
  await recordAudit({ actorId: user.id, action: "volunteer.decline", entityType: "volunteer", entityId: id });
  revalidatePath("/admin/volunteers");
}

export async function saveOpportunity(formData: FormData) {
  const user = await actor("volunteers");
  const id = str(formData, "id");
  const slots = Math.max(0, Number(str(formData, "slots") || 10) || 0);
  const values = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    location: str(formData, "location") || null,
    slots,
    status: (str(formData, "status") || "published") as "draft" | "preview" | "published" | "archived",
    publishedAt: new Date(),
  };
  if (id) {
    await getDb().update(volunteerOpportunities).set(values).where(eq(volunteerOpportunities.id, id));
    await recordAudit({ actorId: user.id, action: "opportunity.update", entityType: "volunteer_opportunity", entityId: id });
  } else {
    await getDb().insert(volunteerOpportunities).values(values);
    await recordAudit({ actorId: user.id, action: "opportunity.create", entityType: "volunteer_opportunity" });
  }
  revalidateContent(CACHE_TAGS.volunteers);
  revalidatePath("/admin/volunteers");
  revalidatePath("/get-involved/volunteer");
  revalidatePath("/dashboard");
}

export async function saveUser(formData: FormData) {
  const user = await primaryAdminActor();
  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  const password = str(formData, "password") || randomBytes(10).toString("base64url");
  if (!email || !email.includes("@") || !name || password.length < 10) {
    throw new Error("Enter a name, a valid email, and a temporary password of at least 10 characters.");
  }
  const permissions = readAdminPermissions(formData);
  if (!Object.values(permissions).some(Boolean)) {
    throw new Error("Choose at least one privilege for this administrator.");
  }
  const [role] = await getDb()
    .insert(roles)
    .values({
      name: str(formData, "roleTitle") || "Sub-administrator",
      slug: `staff-${randomBytes(8).toString("hex")}`,
      permissions,
    })
    .returning();
  await getDb().insert(users).values({
    email,
    name,
    roleId: role.id,
    passwordHash: await hashPassword(password),
    emailVerifiedAt: new Date(),
  });
  await recordAudit({ actorId: user.id, action: "admin.create", entityType: "user", metadata: { email, permissions } });
  revalidatePath("/admin/users");
}

export async function updateAdminPrivileges(formData: FormData) {
  const user = await primaryAdminActor();
  const id = str(formData, "id");
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) throw new Error("Administrator account not found.");
  if (isPrimaryAdmin({ ...user, email: target.email, roleSlug: target.roleId ? "admin" : null })) {
    throw new Error("The primary administrator is controlled through environment configuration and cannot be changed here.");
  }
  const permissions = readAdminPermissions(formData);
  const [role] = await db
    .insert(roles)
    .values({
      name: str(formData, "roleTitle") || "Sub-administrator",
      slug: `staff-${randomBytes(8).toString("hex")}`,
      permissions,
    })
    .returning();
  const isActive = formData.get("isActive") === "on";
  await db.update(users).set({ roleId: role.id, isActive, updatedAt: new Date() }).where(eq(users.id, id));
  if (!isActive) await db.delete(sessions).where(eq(sessions.userId, id));
  await recordAudit({ actorId: user.id, action: "admin.privileges.update", entityType: "user", entityId: id, metadata: { permissions, isActive } });
  revalidatePath("/admin/users");
}

export async function markMessageRead(formData: FormData) {
  await actor("content");
  await getDb()
    .update(contactMessages)
    .set({ status: "read" })
    .where(eq(contactMessages.id, str(formData, "id")));
  revalidatePath("/admin");
}

export async function fulfillDataDeletion(formData: FormData) {
  const actorUser = await actor("users");
  const email = str(formData, "email").toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Enter the email address to redact.");
  }
  if (email === actorUser.email) {
    throw new Error("You cannot redact your own signed-in account from this form.");
  }

  const db = getDb();
  const redactedEmail = `redacted.${Date.now()}@deleted.local`;
  const [target] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (target) {
    await db.delete(sessions).where(eq(sessions.userId, target.id));
    await db
      .update(users)
      .set({
        name: "Redacted",
        email: redactedEmail,
        passwordHash: null,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, target.id));
  }

  await db
    .update(ambassadors)
    .set({
      fullName: "Redacted",
      email: redactedEmail,
      phone: null,
      region: null,
      profession: null,
      whyJoin: "[redacted on request]",
      whatsapp: null,
      currentAddress: null,
      organization: null,
      contributions: null,
      photoUrl: null,
      consentToDirectory: false,
      updatedAt: new Date(),
    })
    .where(eq(ambassadors.email, email));

  await db
    .update(donations)
    .set({
      donorName: "Redacted",
      donorEmail: redactedEmail,
      donorPhone: null,
    })
    .where(eq(donations.donorEmail, email));

  await db
    .update(volunteerApplications)
    .set({
      fullName: "Redacted",
      email: redactedEmail,
      phone: null,
      message: "[redacted on request]",
    })
    .where(eq(volunteerApplications.email, email));

  await db
    .update(eventRegistrations)
    .set({
      name: "Redacted",
      email: redactedEmail,
      phone: null,
    })
    .where(eq(eventRegistrations.email, email));

  await db
    .update(contactMessages)
    .set({
      name: "Redacted",
      email: redactedEmail,
      body: "[redacted on request]",
      status: "closed",
    })
    .where(eq(contactMessages.email, email));

  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));

  await recordAudit({
    actorId: actorUser.id,
    action: "privacy.delete",
    entityType: "person",
    metadata: { email },
  });
  revalidateContent(CACHE_TAGS.ambassadors);
  revalidatePath("/admin/users");
  revalidatePath("/admin/membership");
  revalidatePath("/admin/donations");
}

export async function savePerson(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  const group = str(formData, "group");
  if (!["board", "executive", "advisor"].includes(group)) {
    throw new Error("Choose board, executive, or advisor.");
  }
  const values = {
    name: str(formData, "name"),
    position: str(formData, "position"),
    group: group as "board" | "executive" | "advisor",
    photoUrl: str(formData, "photoUrl") || null,
    bio: str(formData, "bio"),
    responsibility: str(formData, "responsibility") || null,
    sortOrder: Number(str(formData, "sortOrder") || "0") || 0,
    status: (str(formData, "status") || "published") as "draft" | "preview" | "published" | "archived",
    updatedAt: new Date(),
  };
  if (id) {
    await getDb().update(people).set(values).where(eq(people.id, id));
    await recordAudit({ actorId: user.id, action: "person.update", entityType: "person", entityId: id });
  } else {
    const [created] = await getDb().insert(people).values(values).returning();
    await recordAudit({ actorId: user.id, action: "person.create", entityType: "person", entityId: created.id });
  }
  revalidateContent(CACHE_TAGS.people);
  revalidatePath("/admin/leadership");
  revalidatePath("/about");
}

export async function deletePerson(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  await getDb().delete(people).where(eq(people.id, id));
  await recordAudit({ actorId: user.id, action: "person.delete", entityType: "person", entityId: id });
  revalidateContent(CACHE_TAGS.people);
  revalidatePath("/admin/leadership");
  revalidatePath("/about");
}

export async function saveFaq(formData: FormData) {
  const user = await actor("content");
  await getDb().insert(faqItems).values({
    question: str(formData, "question"),
    answer: str(formData, "answer"),
    audience: str(formData, "audience") || "general",
    status: "published",
  });
  await recordAudit({ actorId: user.id, action: "faq.create", entityType: "faq" });
  revalidateContent(CACHE_TAGS.faqs);
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

export async function deleteFaq(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  await getDb().delete(faqItems).where(eq(faqItems.id, id));
  await recordAudit({ actorId: user.id, action: "faq.delete", entityType: "faq", entityId: id });
  revalidateContent(CACHE_TAGS.faqs);
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

export async function saveYoutubeVideo(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  const youtubeUrl = str(formData, "youtubeUrl");
  const youtubeId = youtubeIdFromUrl(youtubeUrl);
  if (!youtubeId) {
    throw new Error("Paste a YouTube video link (watch, youtu.be, shorts, or embed) — not a channel page.");
  }
  const collection = str(formData, "collection") === "news" ? "news" : "podcast";
  const oembed = await fetchYoutubeOEmbed(youtubeWatchUrl(youtubeId));
  const title = str(formData, "title") || oembed?.title;
  if (!title) {
    throw new Error("Add a title, or check that the YouTube link is public so the title can be fetched.");
  }
  const values = {
    youtubeUrl: youtubeWatchUrl(youtubeId),
    youtubeId,
    title,
    description: str(formData, "description"),
    thumbnailUrl: str(formData, "thumbnailUrl") || oembed?.thumbnailUrl || youtubeThumbnailUrl(youtubeId),
    collection,
    sortOrder: Number(str(formData, "sortOrder") || 0) || 0,
    status: (str(formData, "status") || "published") as "draft" | "preview" | "published" | "archived",
    publishedAt: str(formData, "status") === "draft" ? null : new Date(),
    updatedAt: new Date(),
  };
  if (id) {
    await getDb().update(youtubeVideos).set(values).where(eq(youtubeVideos.id, id));
    await recordAudit({ actorId: user.id, action: "video.update", entityType: "youtube_video", entityId: id });
  } else {
    const [created] = await getDb().insert(youtubeVideos).values(values).returning();
    await recordAudit({ actorId: user.id, action: "video.create", entityType: "youtube_video", entityId: created.id });
  }
  revalidateContent(CACHE_TAGS.videos);
  revalidatePath("/admin/podcast");
  revalidatePath("/podcast");
  revalidatePath("/stories");
  redirect("/admin/podcast");
}

export async function deleteYoutubeVideo(formData: FormData) {
  const user = await actor("content");
  const id = str(formData, "id");
  await getDb().delete(youtubeVideos).where(eq(youtubeVideos.id, id));
  await recordAudit({ actorId: user.id, action: "video.delete", entityType: "youtube_video", entityId: id });
  revalidateContent(CACHE_TAGS.videos);
  revalidatePath("/admin/podcast");
  revalidatePath("/podcast");
  revalidatePath("/stories");
}

export async function uploadMedia(formData: FormData) {
  await uploadEmbeddedMedia(formData);
  revalidatePath("/admin/media");
}

/** Uploads an editor asset to R2 and records only its metadata in the media library. */
export async function uploadEmbeddedMedia(formData: FormData): Promise<{ url: string; thumbnailUrl: string }> {
  const user = await actor("content");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be inserted into the editor.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Images must be 10 MB or smaller.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `library/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const uploaded = await putObject({
    key,
    body: bytes,
    contentType: file.type || "application/octet-stream",
  });
  await getDb().insert(mediaAssets).values({
    key,
    url: uploaded.url,
    thumbnailUrl: uploaded.url,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    byteSize: file.size,
    uploadedById: user.id,
  });
  await recordAudit({ actorId: user.id, action: "media.upload", entityType: "media", metadata: { key } });
  return { url: uploaded.url, thumbnailUrl: uploaded.url };
}
