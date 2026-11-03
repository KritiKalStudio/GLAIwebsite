import { sendDueEventReminders } from "@/lib/events/reminders";
import { optionalEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = optionalEnv("CRON_SECRET");
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendDueEventReminders();
  return Response.json(result);
}
