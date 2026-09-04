const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img", "iframe"]);

function safeUrl(value: string, kind: "link" | "image" | "video") {
  try {
    const url = new URL(value, "https://example.org");
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (kind === "video" && !/(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i.test(url.hostname)) return "";
    return url.href;
  } catch {
    return "";
  }
}

/** Sanitizes editor markup before it is stored or rendered on a public route. */
export function sanitizeRichText(input: string) {
  const cleaned = input.replace(/<!--[\s\S]*?-->|<\/?(?:script|style|object|embed)[^>]*>/gi, "");
  return cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;
    const attrs: string[] = [];
    const href = /\bhref=["']([^"']+)["']/i.exec(rawAttributes)?.[1];
    const src = /\bsrc=["']([^"']+)["']/i.exec(rawAttributes)?.[1];
    const alt = /\balt=["']([^"']*)["']/i.exec(rawAttributes)?.[1];
    if (tag === "a" && href) { const url = safeUrl(href, "link"); if (url) attrs.push(`href="${url}"`, 'target="_blank"', 'rel="noopener noreferrer"'); }
    if (tag === "img" && src) { const url = safeUrl(src, "image"); if (url) attrs.push(`src="${url}"`, `alt="${(alt ?? "").replace(/[<>"]/g, "")}"`, 'loading="lazy"'); }
    if (tag === "iframe" && src) { const url = safeUrl(src, "video"); if (url) attrs.push(`src="${url}"`, 'title="Embedded video"', 'allowfullscreen=""'); else return ""; }
    return `<${tag}${attrs.length ? ` ${attrs.join(" ")}` : ""}>`;
  });
}

export function editorHtml(value: string) {
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value.split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${paragraph.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`).join("");
}
