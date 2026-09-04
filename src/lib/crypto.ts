import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { optionalEnv } from "@/lib/env";

const PREFIX = "enc:v1:";

function keyBytes() {
  const raw = optionalEnv("FIELD_ENCRYPTION_KEY") ?? optionalEnv("AUTH_SECRET");
  if (!raw) {
    throw new Error("FIELD_ENCRYPTION_KEY or AUTH_SECRET is required to encrypt fields.");
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptField(plain: string | null | undefined): string | null {
  if (!plain) return null;
  if (plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith(PREFIX)) return value;
  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
