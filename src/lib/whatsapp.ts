import { optionalEnv } from "@/lib/env";

export function normalizeWhatsapp(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : `+${digits}`;
}

export async function sendWhatsappCode(to: string, code: string): Promise<{ sent: boolean; skipped: boolean }> {
  const body = `GLAI confirmation code: ${code}. It expires in 10 minutes. If you did not sign up, ignore this message.`;
  const token = optionalEnv("WHATSAPP_TOKEN");
  const phoneId = optionalEnv("WHATSAPP_PHONE_NUMBER_ID");
  if (token && phoneId) {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        type: "text",
        text: { preview_url: false, body },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`WhatsApp Cloud API rejected the message (${res.status}): ${detail.slice(0, 200)}`);
    }
    return { sent: true, skipped: false };
  }

  const sid = optionalEnv("TWILIO_ACCOUNT_SID");
  const auth = optionalEnv("TWILIO_AUTH_TOKEN");
  const from = optionalEnv("TWILIO_WHATSAPP_FROM");
  if (sid && auth && from) {
    const params = new URLSearchParams({
      From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      To: `whatsapp:${to}`,
      Body: body,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Twilio WhatsApp rejected the message (${res.status}): ${detail.slice(0, 200)}`);
    }
    return { sent: true, skipped: false };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("WhatsApp is not configured. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID, or Twilio WhatsApp credentials.");
  }
  return { sent: false, skipped: true };
}
