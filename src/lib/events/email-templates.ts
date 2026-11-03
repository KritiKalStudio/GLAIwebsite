import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationTemplates } from "@/db/schema";

export const EVENT_EMAIL_TEMPLATES: { type: string; subject: string; body: string }[] = [
  {
    type: "event_registration",
    subject: "Your response is confirmed: {{eventTitle}}",
    body: "Dear {{name}},\n\nWe recorded your response for {{eventTitle}}.\nYour answer: {{response}}.\nWhen: {{eventDate}}\nWhere: {{venue}}\n\n{{details}}\n\nYou can update your response with the same email address: {{rsvpUrl}}\n\nGLAI",
  },
  {
    type: "event_reminder",
    subject: "Reminder: {{eventTitle}}",
    body: "Dear {{name}},\n\nThis is a reminder that {{eventTitle}} begins on {{eventDate}}.\nWhere: {{venue}}\n\nYour response and the event details are here: {{rsvpUrl}}\n\nGLAI",
  },
  {
    type: "event_invite",
    subject: "You are invited: {{eventTitle}}",
    body: "Hello {{name}},\n\nYou are invited to {{eventTitle}}.\nWhen: {{eventDate}}\nWhere: {{venue}}\n\nPlease tell us whether you plan to attend: {{rsvpUrl}}\n\nGLAI",
  },
];

const PREVIOUS_BODIES: Record<string, string[]> = {
  event_registration: [
    "Dear {{name}},\n\nYou are registered for {{eventTitle}} on {{eventDate}}. If the event is full you will be waitlisted and notified.\n\nGLAI",
  ],
  event_reminder: [
    "Dear {{name}},\n\nThis is a reminder that {{eventTitle}} begins on {{eventDate}}.\n\nGLAI",
  ],
};

export async function ensureEventEmailTemplates() {
  const db = getDb();
  for (const template of EVENT_EMAIL_TEMPLATES) {
    const [existing] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.type, template.type))
      .limit(1);
    if (!existing) {
      await db.insert(notificationTemplates).values(template).onConflictDoNothing();
      continue;
    }
    const previous = PREVIOUS_BODIES[template.type] ?? [];
    if (previous.includes(existing.body)) {
      await db
        .update(notificationTemplates)
        .set({ subject: template.subject, body: template.body, updatedAt: new Date() })
        .where(eq(notificationTemplates.id, existing.id));
    }
  }
}
