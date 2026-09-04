export function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return undefined;
  return value;
}

export function requiredEnv(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSiteUrl(): string {
  return (optionalEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function getMediaBaseUrl(): string {
  return (optionalEnv("NEXT_PUBLIC_MEDIA_BASE_URL") ?? "").replace(/\/$/, "");
}
