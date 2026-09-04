import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { getDb } from "@/db";
import { notificationLog, notificationTemplates } from "@/db/schema";
import { optionalEnv } from "@/lib/env";

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function sendTemplatedEmail(input: {
  type: string;
  to: string;
  vars?: Record<string, string>;
  locale?: string;
}) {
  const db = getDb();
  const locale = input.locale ?? "en";
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.type, input.type))
    .limit(1);

  const fallback = {
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

  const apiKey = optionalEnv("RESEND_API_KEY");
  const from = optionalEnv("RESEND_FROM_EMAIL") ?? "GLAI <noreply@globalloveambassadors.org>";

  if (!apiKey || apiKey.includes("xxxx")) {
    await db
      .update(notificationLog)
      .set({
        status: "sent",
        sentAt: new Date(),
        error: "Sandbox: RESEND_API_KEY not configured; logged only",
      })
      .where(eq(notificationLog.id, log.id));
    console.info(`[notify:${input.type}] to=${input.to} subject=${subject}`);
    return { id: log.id, sandbox: true };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: input.to,
      subject,
      text: body,
    });
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
