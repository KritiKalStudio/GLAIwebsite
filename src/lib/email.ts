import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getDb } from "@/db";
import { notificationLog, notificationTemplates } from "@/db/schema";
import {
  formatFrom,
  fromAddressFor,
  getMailSettings,
  mailIsConfigured,
  resendApiKey,
  smtpPassword,
  smtpUser,
  type MailFromRole,
} from "@/lib/mail";

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

async function deliverEmail(input: {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const settings = await getMailSettings();
  if (!mailIsConfigured(settings)) {
    return { sandbox: true as const, error: "Email delivery is not configured" };
  }

  if (settings.provider === "google_smtp") {
    const user = smtpUser(settings);
    const pass = smtpPassword(settings);
    if (!user || !pass) {
      return { sandbox: true as const, error: "Google SMTP is selected but the Gmail address or app password is missing" };
    }
    const port = settings.googleSmtp.port || 465;
    const transporter = nodemailer.createTransport({
      host: settings.googleSmtp.host || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: formatFrom(input.fromName, input.fromEmail || user),
      to: input.to,
      subject: input.subject,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { sandbox: false as const };
  }

  const apiKey = resendApiKey(settings);
  if (!apiKey) {
    return { sandbox: true as const, error: "Resend is selected but no API key is saved" };
  }
  const resend = new Resend(apiKey);
  const from = formatFrom(input.fromName, input.fromEmail);
  await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
  });
  return { sandbox: false as const };
}

export async function sendTemplatedEmail(input: {
  type: string;
  to: string;
  vars?: Record<string, string>;
  locale?: string;
  role?: MailFromRole;
  replyTo?: string;
}) {
  const db = getDb();
  const locale = input.locale ?? "en";
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.type, input.type))
    .limit(1);

  const fallbackByType: Record<string, { subject: string; body: string }> = {
    signup_code: {
      subject: "Your GLAI confirmation code",
      body: "Hello {{name}},\n\nYour GLAI confirmation code is {{code}}. It expires in 10 minutes. If you did not sign up, ignore this email.",
    },
    password_reset: {
      subject: "Reset your GLAI password",
      body: "Hello {{name}},\n\nUse this link to choose a new password: {{resetUrl}}\n\nIf you did not ask for this, you can ignore the email.",
    },
    contact_message: {
      subject: "New website message: {{topic}}",
      body: "From {{name}} <{{email}}>\n\n{{body}}",
    },
  };
  const fallback = fallbackByType[input.type] ?? {
    subject: `GLAI: ${input.type}`,
    body: "Thank you for connecting with the Global Love Ambassadors Initiative.",
  };
  const subject = interpolate(template?.subject ?? fallback.subject, input.vars ?? {});
  const body = interpolate(template?.body ?? fallback.body, input.vars ?? {});

  const [log] = await db
    .insert(notificationLog)
    .values({
      templateType: input.type,
      toEmail: input.to,
      subject,
      body,
      status: "queued",
      payload: { locale, ...(input.vars ?? {}) },
    })
    .returning();

  const settings = await getMailSettings();
  const from = fromAddressFor(settings, input.type, input.role);

  if (!mailIsConfigured(settings) || !from.email) {
    await db
      .update(notificationLog)
      .set({
        status: "sent",
        sentAt: new Date(),
        error: "Sandbox: mail provider is not fully configured; logged only",
      })
      .where(eq(notificationLog.id, log.id));
    console.info(`[notify:${input.type}] to=${input.to} subject=${subject}`);
    return { id: log.id, sandbox: true };
  }

  try {
    const result = await deliverEmail({
      fromName: from.name,
      fromEmail: from.email,
      to: input.to,
      subject,
      text: body,
      replyTo: input.replyTo,
    });
    if (result.sandbox) {
      await db
        .update(notificationLog)
        .set({
          status: "sent",
          sentAt: new Date(),
          error: result.error ?? "Sandbox: logged only",
        })
        .where(eq(notificationLog.id, log.id));
      console.info(`[notify:${input.type}] to=${input.to} subject=${subject}`);
      return { id: log.id, sandbox: true };
    }
    await db
      .update(notificationLog)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(notificationLog.id, log.id));
    return { id: log.id, sandbox: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    await db
      .update(notificationLog)
      .set({ status: "failed", error: message })
      .where(eq(notificationLog.id, log.id));
    throw error;
  }
}

export async function sendSignupCodeEmail(to: string, code: string, name: string) {
  const settings = await getMailSettings();
  if (!mailIsConfigured(settings)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Email delivery is not configured. An administrator must set Google SMTP or Resend in Settings.",
      );
    }
    return { sandbox: true };
  }
  const result = await sendTemplatedEmail({
    type: "signup_code",
    to,
    role: "membershipFrom",
    vars: {
      name,
      code,
    },
  });
  if (result.sandbox) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email could not be sent. Check Google SMTP or Resend in Settings.");
    }
    return { sandbox: true };
  }
  return { sandbox: false };
}
