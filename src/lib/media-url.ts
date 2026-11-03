const STATIC_IMAGE_HOSTS = [
  "pub-2523b5c66e3a4c9a8910900e1f632c44.r2.dev",
  "media.glainitiative.org",
  "images.unsplash.com",
  "img.youtube.com",
  "i.ytimg.com",
];

/** Hostname from a full URL or a bare host such as media.example.org. */
export function mediaHostname(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export function imageHostnames(mediaBase?: string | null): string[] {
  const hosts = new Set(STATIC_IMAGE_HOSTS);
  const fromEnv = mediaHostname(mediaBase);
  if (fromEnv) hosts.add(fromEnv);
  return [...hosts];
}

/** Turn a stored media value into an absolute URL. Bare hosts become https. */
export function normalizeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function canOptimizeImage(src: string, mediaBase?: string | null): boolean {
  if (src.startsWith("/")) return true;
  const host = mediaHostname(src);
  if (!host) return false;
  return imageHostnames(mediaBase).includes(host);
}
