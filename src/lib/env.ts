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

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalHostUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function vercelPublicUrl() {
  const production = optionalEnv("VERCEL_PROJECT_PRODUCTION_URL");
  if (production) {
    return stripTrailingSlash(
      production.startsWith("http") ? production : `https://${production}`,
    );
  }
  const deployment = optionalEnv("VERCEL_URL");
  if (deployment) {
    return stripTrailingSlash(
      deployment.startsWith("http") ? deployment : `https://${deployment}`,
    );
  }
  return undefined;
}

export function getSiteUrl(): string {
  const configured = optionalEnv("NEXT_PUBLIC_SITE_URL");
  if (configured && !isLocalHostUrl(configured)) {
    return stripTrailingSlash(configured);
  }
  return vercelPublicUrl() ?? stripTrailingSlash(configured ?? "http://localhost:3000");
}

export async function getRequestSiteUrl(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
    if (host && !isLocalHostUrl(host)) {
      const proto = headerList.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // headers() is unavailable at build time
  }
  return getSiteUrl();
}

export function getMediaBaseUrl(): string {
  return (optionalEnv("NEXT_PUBLIC_MEDIA_BASE_URL") ?? "").replace(/\/$/, "");
}
