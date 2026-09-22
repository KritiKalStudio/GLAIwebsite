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

async function mintSessionRetry(email: string) {
  let last: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await mintSession(email);
    } catch (error) {
      last = error;
      const code = (error as { cause?: { code?: string } }).cause?.code;
      if (code !== "ENOTFOUND" && !String(error).includes("ENOTFOUND")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw last;
}

async function main() {
  const publicPaths = [
    "/",
    "/about",
    "/our-work",
    "/our-work/love-ambassador-training",
    "/our-work/civic-education",
    "/impact",
    "/get-involved",
    "/get-involved/volunteer",
    "/get-involved/partner",
    "/love-ambassadors",
    "/signup",
    "/love-ambassadors/network",
    "/stories",
    "/stories/from-division-to-dialogue",
    "/podcast",
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
  expectContains("home civic education", home.body, "Civic education, without a party line");
  const civic = await request("/our-work/civic-education");
  expectContains("civic program heading", civic.body, "Civic Education");
  expectContains("civic nonpartisan", civic.body, "without GLAI projecting");
  expectContains("program donate now", civic.body, "Donate now");
  expectContains("program other programs", civic.body, "Other programs");
  const about = await request("/about");
  expectContains("about leadership", about.body, "Leadership");
  const chairCards = about.body.match(/<h3[^>]*>Dr\. Eniola Biodun<\/h3>/g) ?? [];
  const directorCards = about.body.match(/<h3[^>]*>Engr\. Usman Abubakar<\/h3>/g) ?? [];
  record(
    "about leadership not duplicated",
    chairCards.length === 1 && directorCards.length === 1,
    `chair=${chairCards.length} director=${directorCards.length}`,
  );
  record(
    "about leadership round photo",
    /h-20 w-20 shrink-0 (?:rounded-full object-cover|place-items-center rounded-full)/.test(about.body),
    "round avatar on cards",
  );
  const podcast = await request("/podcast");
  record(
    "podcast listing",
    podcast.body.includes("Episodes will appear here") || podcast.body.includes("Open in YouTube"),
    "empty state or published episode",
  );
  const stories = await request("/stories");
  expectContains("stories news channel copy", stories.body, "Films from the GLAI news channel");
  const primaryNavHtml = home.body.split('aria-label="Primary"')[1]?.split("</nav>")[0] ?? "";
  const exploreIdx = primaryNavHtml.indexOf(">Explore");
  const beforeExplore = exploreIdx >= 0 ? primaryNavHtml.slice(0, exploreIdx) : primaryNavHtml;
  const afterExplore = exploreIdx >= 0 ? primaryNavHtml.slice(exploreIdx) : "";
  expectContains("nav podcast primary", beforeExplore, 'href="/podcast"');
  expectContains("nav stories primary", beforeExplore, 'href="/stories"');
  record("nav impact not primary", !beforeExplore.includes('href="/impact"'), "Impact is under Explore");
  expectContains("nav impact explore", afterExplore, 'href="/impact"');
  expectContains("nav ambassadors explore", afterExplore, 'href="/love-ambassadors"');
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
  expectContains("french switcher", french.body, "Français");
  expectContains("french civic heading remains", french.body, "Civic education, without a party line");
  const setCookie = french.headers.get("set-cookie") ?? "";
  record("locale cookie set", setCookie.includes("glai_locale=fr"), setCookie.slice(0, 80));

  const robots = await request("/robots.txt");
  expectContains("robots disallow admin", robots.body, "Disallow: /admin");
  expectContains("robots sitemap", robots.body, "Sitemap:");

  const sitemap = await request("/sitemap.xml");
  expectContains("sitemap home", sitemap.body, `${BASE}/`);
  expectContains("sitemap podcast", sitemap.body, `${BASE}/podcast`);
  expectContains("sitemap signup", sitemap.body, `${BASE}/signup`);
  expectContains("sitemap hreflang fr", sitemap.body, "hreflang=\"fr\"");

  const privacy = await request("/legal/privacy");
  expectContains("privacy deletion copy", privacy.body, "Privacy / deletion");
  expectContains("privacy encrypted phones", privacy.body, "Phone numbers are stored encrypted");

  const cookiesPage = await request("/legal/cookies");
  expectContains("cookie policy names", cookiesPage.body, "glai_cookie_consent");

  const donate = await request("/donate");
  expectContains("donate form", donate.body, "Complete sandbox gift");
  expectContains("donate sponsor programs", donate.body, "Sponsor a program");
  record(
    "donate no card fields",
    !donate.body.includes('name="cardNumber"') && !donate.body.includes('name="cvv"'),
    "no card number or cvv fields",
  );

  const apply = await request("/love-ambassadors/apply");
  expectStatus("/love-ambassadors/apply redirect", apply.status, [307, 308, 302]);
  record(
    "apply redirects to signup",
    (apply.location ?? "").includes("/signup"),
    apply.location ?? "no location",
  );

  const signup = await request("/signup");
  expectStatus("/signup", signup.status, [200]);
  expectContains("signup full name", signup.body, 'name="fullName"');
  expectContains("signup whatsapp", signup.body, 'name="whatsapp"');
  expectContains("signup password", signup.body, 'name="password"');
  expectContains("signup confirm password", signup.body, 'name="confirmPassword"');

  const login = await request("/login");
  expectContains("login sign up link", login.body, 'href="/signup"');
  expectContains("login forgot password", login.body, "/forgot-password");
  record("header has no join cta", !home.body.includes('href="/love-ambassadors/apply"'), "Join apply CTA removed");

  const eventsTab = await request("/stories?category=events");
  expectStatus("/stories events tab", eventsTab.status, [200]);
  expectContains("events tab heading", eventsTab.body, "Gatherings published from the Events console");
  expectContains("events tab published event", eventsTab.body, "Unity Dialogue — Community Listening Session");

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

  const admin = await mintSessionRetry("admin@glai.org");
  const ambassador = await mintSessionRetry("ada.okonkwo@example.org");
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
    record("donations no campaign creator", !donationsPage.body.includes("Add a campaign"), "campaigns live on Programs");
    expectContains("donations manage programs", donationsPage.body, "Manage on Programs");

    const volunteersAdmin = await request("/admin/volunteers", { cookie: admin.cookie });
    expectStatus("/admin/volunteers", volunteersAdmin.status, [200]);
    expectContains("volunteer slots field", volunteersAdmin.body, 'name="slots"');
    record("volunteers no accept gate", !volunteersAdmin.body.includes("Accept"), "roster only");

    const settingsAdmin = await request("/admin/settings", { cookie: admin.cookie });
    expectStatus("/admin/settings", settingsAdmin.status, [200]);
    expectContains("bank account number", settingsAdmin.body, 'name="bankAccountNumber"');

    const mediaAdmin = await request("/admin/media", { cookie: admin.cookie });
    expectStatus("/admin/media", mediaAdmin.status, [200]);
    expectContains("media upload", mediaAdmin.body, 'type="file"');

    const podcastAdmin = await request("/admin/podcast", { cookie: admin.cookie });
    expectStatus("/admin/podcast", podcastAdmin.status, [200]);
    expectContains("podcast admin form", podcastAdmin.body, 'name="youtubeUrl"');

    const leadershipAdmin = await request("/admin/leadership", { cookie: admin.cookie });
    expectStatus("/admin/leadership", leadershipAdmin.status, [200]);
    expectContains("leadership photo picker", leadershipAdmin.body, 'name="photoUrl"');
    expectContains("leadership bio", leadershipAdmin.body, 'name="bio"');
    expectContains("leadership add", leadershipAdmin.body, "Add a leader");

    const membership = await request("/admin/membership", { cookie: admin.cookie });
    expectStatus("/admin/membership", membership.status, [200]);
    record("membership no review queue", !membership.body.includes("Waiting for review"), "directory only");
    record("membership no approve copy", !membership.body.includes("Approve application"), "no review actions");

    const dash = await request("/dashboard", { cookie: ambassador.cookie });
    expectStatus("/dashboard authenticated", dash.status, [200]);
    expectContains("dashboard welcome", dash.body, "Welcome,");
    expectContains("dashboard nav referrals", dash.body, "/dashboard/referrals");
    expectContains("dashboard nav leaderboard", dash.body, "/dashboard/leaderboard");
    expectContains("dashboard nav involved", dash.body, "/dashboard/get-involved");
    expectContains("dashboard nav profile", dash.body, "/dashboard/profile");
    expectContains("dashboard nav settings", dash.body, "/dashboard/settings");
    record("dashboard no training modules", !dash.body.includes("Training modules"), "learning modules removed");
    record("dashboard no certificates", !dash.body.includes("Certificates"), "certificates removed");

    const referrals = await request("/dashboard/referrals", { cookie: ambassador.cookie });
    expectStatus("/dashboard/referrals authenticated", referrals.status, [200]);
    expectContains("dashboard referral link", referrals.body, "Your referral link");
    expectContains("dashboard referral honour", referrals.body, "Starter");

    const profile = await request("/dashboard/profile", { cookie: ambassador.cookie });
    expectStatus("/dashboard/profile authenticated", profile.status, [200]);
    expectContains("dashboard save profile", profile.body, "Save profile");

    const involved = await request("/dashboard/get-involved", { cookie: ambassador.cookie });
    expectStatus("/dashboard/get-involved authenticated", involved.status, [200]);
    expectContains("dashboard volunteer roles", involved.body, "Volunteer opportunities");

    const settings = await request("/dashboard/settings", { cookie: ambassador.cookie });
    expectStatus("/dashboard/settings authenticated", settings.status, [200]);
    expectContains("dashboard current password", settings.body, 'name="currentPassword"');
    expectContains("dashboard new password", settings.body, 'name="password"');

    for (const path of [
      "/dashboard/referrals",
      "/dashboard/leaderboard",
      "/dashboard/get-involved",
      "/dashboard/profile",
      "/dashboard/settings",
    ]) {
      const gate = await request(path);
      expectStatus(`${path} unauthenticated`, gate.status, [307, 308, 302]);
    }

    const leaderboardGate = await request("/dashboard/leaderboard");
    expectStatus("/dashboard/leaderboard unauthenticated", leaderboardGate.status, [307, 308, 302]);
    const leaderboard = await request("/dashboard/leaderboard", { cookie: ambassador.cookie });
    expectStatus("/dashboard/leaderboard authenticated", leaderboard.status, [200]);
    expectContains("leaderboard heading", leaderboard.body, "Referral leaderboard");

    const signupRef = await request("/signup?ref=not-a-code");
    expectStatus("/signup with referral", signupRef.status, [200]);
    expectContains("signup referral field", signupRef.body, 'name="referralCode"');

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
