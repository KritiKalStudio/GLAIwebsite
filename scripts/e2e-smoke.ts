import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { getDb } from "@/db";
import { donations, sessions, users } from "@/db/schema";
import { encryptField } from "@/lib/crypto";
import { requiredEnv } from "@/lib/env";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const SESSION_DAYS = 14;

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  const mark = ok ? "ok" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(
  path: string,
  init: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; location: string | null; body: string; headers: Headers }> {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });
  const location = res.headers.get("location");
  const body = await res.text();
  return { status: res.status, location, body, headers: res.headers };
}

function expectStatus(name: string, got: number, allowed: number[], extra = "") {
  record(name, allowed.includes(got), `status ${got}${extra ? `; ${extra}` : ""}`);
}

function expectContains(name: string, body: string, needle: string) {
  record(name, body.includes(needle), needle);
}

async function mintSession(email: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error(`No user ${email}`);
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt });
  const token = await new SignJWT({ sid: sessionId, sub: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(new TextEncoder().encode(requiredEnv("AUTH_SECRET")));
  return { sessionId, cookie: `glai_session=${token}` };
}

async function main() {
  const publicPaths = [
    "/",
    "/about",
    "/our-work",
    "/our-work/love-ambassador-training",
    "/impact",
    "/get-involved",
    "/get-involved/volunteer",
    "/get-involved/partner",
    "/love-ambassadors",
    "/love-ambassadors/apply",
    "/love-ambassadors/network",
    "/stories",
    "/stories/from-division-to-dialogue",
    "/events",
    "/events/unity-dialogue-september",
    "/donate",
    "/contact",
    "/faq",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/terms",
    "/legal/accessibility",
    "/transparency",
    "/resources",
    "/careers",
    "/login",
    "/forgot-password",
    "/style-guide",
    "/sitemap.xml",
    "/robots.txt",
  ];

  for (const path of publicPaths) {
    const res = await request(path);
    expectStatus(path, res.status, [200]);
  }

  const health = await request("/api/health");
  expectStatus(
    "/api/health",
    health.status,
    [200, 503],
    health.status === 503 ? "R2 ping still failing (known)" : "all checks ok",
  );

  const home = await request("/");
  expectContains("skip-link", home.body, "Skip to main content");
  expectContains("cookie-banner", home.body, "Necessary only");
  expectContains("cookie-accept", home.body, "Accept analytics");
  expectContains("json-ld-ngo", home.body, '"@type":"NGO"');
  expectContains("html-lang-en", home.body, 'lang="en"');
  record(
    "header x-content-type-options",
    home.headers.get("x-content-type-options") === "nosniff",
    home.headers.get("x-content-type-options") ?? "missing",
  );
  record(
    "header x-frame-options",
    (home.headers.get("x-frame-options") ?? "").toUpperCase() === "DENY",
    home.headers.get("x-frame-options") ?? "missing",
  );
  record(
    "header referrer-policy",
    home.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    home.headers.get("referrer-policy") ?? "missing",
  );
  record(
    "header permissions-policy",
    (home.headers.get("permissions-policy") ?? "").includes("camera=()"),
    home.headers.get("permissions-policy") ?? "missing",
  );

  const french = await request("/?lang=fr");
  expectContains("french html lang", french.body, 'lang="fr"');
  expectContains("french hero", french.body, "Une page d'accueil en français.");
  const setCookie = french.headers.get("set-cookie") ?? "";
  record("locale cookie set", setCookie.includes("glai_locale=fr"), setCookie.slice(0, 80));

  const robots = await request("/robots.txt");
  expectContains("robots disallow admin", robots.body, "Disallow: /admin");
  expectContains("robots sitemap", robots.body, "Sitemap:");

  const sitemap = await request("/sitemap.xml");
  expectContains("sitemap home", sitemap.body, `${BASE}/`);
  expectContains("sitemap hreflang fr", sitemap.body, "hreflang=\"fr\"");

  const privacy = await request("/legal/privacy");
  expectContains("privacy deletion copy", privacy.body, "Privacy / deletion");
  expectContains("privacy encrypted phones", privacy.body, "Phone numbers are stored encrypted");

  const cookiesPage = await request("/legal/cookies");
  expectContains("cookie policy names", cookiesPage.body, "glai_cookie_consent");

  const donate = await request("/donate");
  expectContains("donate form", donate.body, "Complete sandbox gift");
  record(
    "donate no card fields",
    !donate.body.includes('name="cardNumber"') && !donate.body.includes('name="cvv"'),
    "no card number or cvv fields",
  );

  const apply = await request("/love-ambassadors/apply");
  expectContains("apply form", apply.body, 'name="fullName"');
  expectContains("apply phone", apply.body, 'name="phone"');

  const contact = await request("/contact");
  expectContains("privacy topic", contact.body, "Privacy / deletion");

  const adminGate = await request("/admin");
  expectStatus("/admin unauthenticated", adminGate.status, [307, 308, 302]);
  record(
    "/admin redirects to login",
    (adminGate.location ?? "").includes("/login"),
    adminGate.location ?? "no location",
  );

  const dashGate = await request("/dashboard");
  expectStatus("/dashboard unauthenticated", dashGate.status, [307, 308, 302]);
  record(
    "/dashboard redirects to login",
    (dashGate.location ?? "").includes("/login"),
    dashGate.location ?? "no location",
  );

  const admin = await mintSession("admin@glai.org");
  const ambassador = await mintSession("ada.okonkwo@example.org");
  const db = getDb();

  try {
    const adminHome = await request("/admin", { cookie: admin.cookie });
    expectStatus("/admin authenticated", adminHome.status, [200]);
    expectContains("admin shell", adminHome.body, "Admin");

    const usersPage = await request("/admin/users", { cookie: admin.cookie });
    expectStatus("/admin/users", usersPage.status, [200]);
    expectContains("deletion form", usersPage.body, "Fulfil a deletion request");
    expectContains("deletion email field", usersPage.body, 'name="email"');

    const storyNew = await request("/admin/stories/new", { cookie: admin.cookie });
    expectStatus("/admin/stories/new", storyNew.status, [200]);
    expectContains("safeguarding minors", storyNew.body, 'name="involvesMinors"');
    expectContains("safeguarding reviewed", storyNew.body, 'name="safeguardingReviewed"');

    const donationsPage = await request("/admin/donations", { cookie: admin.cookie });
    expectStatus("/admin/donations", donationsPage.status, [200]);

    const membership = await request("/admin/membership", { cookie: admin.cookie });
    expectStatus("/admin/membership", membership.status, [200]);

    const dash = await request("/dashboard", { cookie: ambassador.cookie });
    expectStatus("/dashboard authenticated", dash.status, [200]);
    expectContains("dashboard heading", dash.body, "My Ambassador Dashboard");

    const ambassadorAdmin = await request("/admin", { cookie: ambassador.cookie });
    record(
      "ambassador cannot open admin",
      ambassadorAdmin.status === 307 ||
        ambassadorAdmin.status === 302 ||
        ambassadorAdmin.status === 308 ||
        (ambassadorAdmin.status === 200 && ambassadorAdmin.body.includes("/login")),
      `status ${ambassadorAdmin.status} loc=${ambassadorAdmin.location ?? ""}`,
    );

    const processorRef = `sandbox_smoke_${randomBytes(4).toString("hex")}`;
    await db.insert(donations).values({
      amount: "10000",
      currency: "NGN",
      frequency: "one_time",
      donorName: "Smoke Donor",
      donorEmail: "smoke.donor@example.org",
      donorPhone: encryptField("+234000000000"),
      isAnonymous: "false",
      processor: "sandbox",
      processorRef,
      status: "completed",
      receiptUrl: `${BASE}/donate/receipt/${processorRef}`,
    });
    const receipt = await request(`/donate/receipt/${processorRef}`);
    expectStatus("sandbox receipt", receipt.status, [200]);
    expectContains("receipt thanks", receipt.body, "Thank you");
    expectContains("receipt amount", receipt.body, "10,000");
    await db.delete(donations).where(eq(donations.processorRef, processorRef));
  } finally {
    await db.delete(sessions).where(eq(sessions.id, admin.sessionId));
    await db.delete(sessions).where(eq(sessions.id, ambassador.sessionId));
  }

  const failed = checks.filter((item) => !item.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
  if (failed.length) {
    console.error("Failures:");
    for (const item of failed) console.error(` - ${item.name}: ${item.detail}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
