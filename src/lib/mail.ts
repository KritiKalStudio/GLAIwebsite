import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import type { MailSettings } from "@/db/schema/settings";
import { decryptField, encryptField } from "@/lib/crypto";
import { optionalEnv } from "@/lib/env";

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  provider: "google_smtp",
  googleSmtp: {
    host: "smtp.gmail.com",
    port: 465,
    user: "",
    fromName: "GLAI",
    fromEmail: "",
  },
  resend: {
    fromName: "GLAI",
    fromEmail: "",
  },
  roles: {
    membershipFrom: "",
    passwordResetFrom: "",
    donationsFrom: "",
    eventsFrom: "",
    volunteersFrom: "",
    newsletterFrom: "",
    contactTo: "",
    donationsNotifyTo: "",
    membershipNotifyTo: "",
    volunteersNotifyTo: "",
  },
};

export type MailFromRole =
  | "membershipFrom"
  | "passwordResetFrom"
  | "donationsFrom"
  | "eventsFrom"
  | "volunteersFrom"
  | "newsletterFrom";

export type MailInboxRole = "contactTo" | "donationsNotifyTo" | "membershipNotifyTo" | "volunteersNotifyTo";

const FROM_ROLE_BY_TYPE: Record<string, MailFromRole> = {
  signup_code: "membershipFrom",
  application_received: "membershipFrom",
  application_approved: "membershipFrom",
  password_reset: "passwordResetFrom",
  donation_confirmation: "donationsFrom",
  donation_receipt: "donationsFrom",
  volunteer_received: "volunteersFrom",
  volunteer_accepted: "volunteersFrom",
  event_registration: "eventsFrom",
  contact_message: "membershipFrom",
};

export function mergeMailSettings(raw?: MailSettings | null): MailSettings {
  return {
    provider: raw?.provider === "resend" ? "resend" : "google_smtp",
    googleSmtp: {
      ...DEFAULT_MAIL_SETTINGS.googleSmtp,
      ...(raw?.googleSmtp ?? {}),
      port: Number(raw?.googleSmtp?.port) || 465,
    },
    resend: {
      ...DEFAULT_MAIL_SETTINGS.resend,
      ...(raw?.resend ?? {}),
    },
    roles: {
      ...DEFAULT_MAIL_SETTINGS.roles,
      ...(raw?.roles ?? {}),
    },
  };
}

export async function getMailSettings(): Promise<MailSettings> {
  const [row] = await getDb()
    .select({ payment: siteSettings.payment, contact: siteSettings.contact })
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);
  const merged = mergeMailSettings(row?.payment?.mail);
  const fallback = row?.contact?.email ?? "";
  if (!merged.googleSmtp.fromEmail) merged.googleSmtp.fromEmail = fallback;
  if (!merged.resend.fromEmail) merged.resend.fromEmail = fallback;
  if (!merged.roles.contactTo) merged.roles.contactTo = fallback;
  return merged;
}

export function smtpPassword(settings: MailSettings): string | undefined {
  const stored = decryptField(settings.googleSmtp.passwordEncrypted ?? null) ?? undefined;
  return stored || optionalEnv("GOOGLE_SMTP_PASSWORD");
}

export function smtpUser(settings: MailSettings): string | undefined {
  return settings.googleSmtp.user || optionalEnv("GOOGLE_SMTP_USER");
}

export function resendApiKey(settings: MailSettings): string | undefined {
  const stored = decryptField(settings.resend.apiKeyEncrypted ?? null) ?? undefined;
  const envKey = optionalEnv("RESEND_API_KEY");
  const key = stored || envKey;
  if (!key || key.includes("xxxx")) return undefined;
  return key;
}

export function extractEmail(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

export function formatFrom(name: string, email: string) {
  const trimmedName = name.trim() || "GLAI";
  const trimmedEmail = extractEmail(email);
  if (!trimmedEmail) return trimmedName;
  return `${trimmedName} <${trimmedEmail}>`;
}

export function fromAddressFor(settings: MailSettings, type: string, explicitRole?: MailFromRole) {
  const role = explicitRole ?? FROM_ROLE_BY_TYPE[type];
  const roleEmail = role ? settings.roles[role] : "";
  if (settings.provider === "google_smtp") {
    const email =
      roleEmail ||
      settings.googleSmtp.fromEmail ||
      smtpUser(settings) ||
      optionalEnv("RESEND_FROM_EMAIL") ||
      "";
    return {
      name: settings.googleSmtp.fromName || "GLAI",
      email: extractEmail(email),
    };
  }
  const fallback = settings.resend.fromEmail || optionalEnv("RESEND_FROM_EMAIL") || "";
  const email = roleEmail || fallback;
  return {
    name: settings.resend.fromName || "GLAI",
    email: extractEmail(email) || extractEmail(fallback),
  };
}

export function inboxFor(settings: MailSettings, role: MailInboxRole) {
  return settings.roles[role]?.trim() || "";
}

export function persistSmtpPassword(next: string, previousEncrypted?: string) {
  const trimmed = next.trim();
  if (trimmed) return encryptField(trimmed) ?? undefined;
  return previousEncrypted;
}

export function persistResendApiKey(next: string, previousEncrypted?: string) {
  const trimmed = next.trim();
  if (trimmed) return encryptField(trimmed) ?? undefined;
  return previousEncrypted;
}

export function mailIsConfigured(settings: MailSettings) {
  if (settings.provider === "google_smtp") {
    return Boolean(smtpUser(settings) && smtpPassword(settings));
  }
  return Boolean(resendApiKey(settings));
}
