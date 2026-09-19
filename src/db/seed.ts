import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";

config({ path: ".env.local" });

import { getDb, getSql } from "@/db";
import { requiredEnv } from "@/lib/env";
import {
  ambassadors,
  campaigns,
  certificates,
  faqItems,
  impactStats,
  notificationTemplates,
  pageBlocks,
  pages,
  people,
  programs,
  projects,
  roles,
  siteSettings,
  stories,
  trainingModules,
  users,
  volunteerOpportunities,
  events,
  ambassadorTrainingProgress,
} from "@/db/schema";

const SAMPLE = "https://images.unsplash.com";

async function seed() {
  const db = getDb();
  const primaryAdminEmail = requiredEnv("PRIMARY_ADMIN_EMAIL").toLowerCase();
  const primaryAdminName = requiredEnv("PRIMARY_ADMIN_NAME");
  const primaryAdminPassword = requiredEnv("PRIMARY_ADMIN_PASSWORD");

  const [adminRole] = await db
    .insert(roles)
    .values({
      name: "Administrator",
      slug: "admin",
      permissions: {
        content: true,
        programs: true,
        membership: true,
        events: true,
        donations: true,
        volunteers: true,
        users: true,
        settings: true,
      },
    })
    .onConflictDoUpdate({
      target: roles.slug,
      set: { name: "Administrator" },
    })
    .returning();

  await db
    .insert(roles)
    .values([
      {
        name: "Editor",
        slug: "editor",
        permissions: { content: true, programs: true },
      },
      {
        name: "Event Coordinator",
        slug: "events",
        permissions: { events: true },
      },
      {
        name: "Finance",
        slug: "finance",
        permissions: { donations: true },
      },
    ])
    .onConflictDoNothing({ target: roles.slug });

  const adminPassword = await bcrypt.hash(primaryAdminPassword, 12);
  const ambassadorPassword = await bcrypt.hash("Ambassador!2026", 12);

  const [adminUser] = await db
    .insert(users)
    .values({
      email: primaryAdminEmail,
      name: primaryAdminName,
      passwordHash: adminPassword,
      roleId: adminRole.id,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: primaryAdminName, passwordHash: adminPassword, roleId: adminRole.id, isActive: true },
    })
    .returning();

  const [ambassadorUser] = await db
    .insert(users)
    .values({
      email: "ada.okonkwo@example.org",
      name: "Ada Okonkwo",
      passwordHash: ambassadorPassword,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: ambassadorPassword, isActive: true },
    })
    .returning();

  const networkAccountSeeds = [
    ["kwame.mensah@example.org", "Kwame Mensah"],
    ["amina.yusuf@example.org", "Amina Yusuf"],
    ["lilian.mukamana@example.org", "Lilian Mukamana"],
    ["thabo.dlamini@example.org", "Thabo Dlamini"],
    ["nour.hassan@example.org", "Nour Hassan"],
    ["fatou.diallo@example.org", "Fatou Diallo"],
    ["samuel.okello@example.org", "Samuel Okello"],
    ["ibrahim.bello@example.org", "Ibrahim Bello"],
    ["chioma.eze@example.org", "Chioma Eze"],
  ] as const;
  await db
    .insert(users)
    .values(networkAccountSeeds.map(([email, name]) => ({ email, name, passwordHash: ambassadorPassword, emailVerifiedAt: new Date() })))
    .onConflictDoUpdate({ target: users.email, set: { passwordHash: ambassadorPassword, isActive: true } });
  const networkUsers = await db.select().from(users);
  const networkUserByEmail = Object.fromEntries(networkUsers.map((user) => [user.email, user]));

  await db
    .insert(siteSettings)
    .values({
      id: "default",
      orgName: "Global Love Ambassadors Initiative",
      tagline: "Humanity Above Differences",
      languages: [
        { code: "en", name: "English", isDefault: true, isActive: true },
        { code: "fr", name: "Français", isActive: true },
        { code: "ar", name: "العربية", isActive: false },
        { code: "pt", name: "Português", isActive: false },
      ],
      navigation: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Our Work", href: "/our-work" },
        { label: "Stories & News", href: "/stories" },
        { label: "Podcast", href: "/podcast" },
        { label: "Impact", href: "/impact" },
        { label: "Love Ambassadors", href: "/love-ambassadors" },
        { label: "Get Involved", href: "/get-involved" },
        { label: "Resources", href: "/resources" },
      ],
      headerCtas: {
        donateLabel: "Donate",
        donateHref: "/donate",
        joinLabel: "Become a Love Ambassador",
        joinHref: "/love-ambassadors",
      },
      footer: {
        tagline:
          "A global movement of people committed to love, unity, peaceful coexistence, and collective progress.",
        columns: [
          {
            title: "Explore",
            links: [
              { label: "About", href: "/about" },
              { label: "Our Work", href: "/our-work" },
              { label: "Impact", href: "/impact" },
              { label: "Love Ambassadors", href: "/love-ambassadors" },
              { label: "Transparency", href: "/transparency" },
            ],
          },
          {
            title: "Participate",
            links: [
              { label: "Stories & News", href: "/stories" },
              { label: "Podcast", href: "/podcast" },
              { label: "Sign up", href: "/signup" },
              { label: "Volunteer", href: "/get-involved/volunteer" },
              { label: "Partner", href: "/get-involved/partner" },
              { label: "Events", href: "/events" },
            ],
          },
          {
            title: "Support",
            links: [
              { label: "Donate", href: "/donate" },
              { label: "Sponsor a program", href: "/donate#sponsor" },
              { label: "Contact", href: "/contact" },
              { label: "FAQ", href: "/faq" },
            ],
          },
        ],
        legalLinks: [
          { label: "Terms of Use", href: "/legal/terms" },
          { label: "Privacy Policy", href: "/legal/privacy" },
          { label: "Cookie Policy", href: "/legal/cookies" },
          { label: "Accessibility", href: "/legal/accessibility" },
        ],
        newsletterLabel: "Stay connected",
        newsletterPlaceholder: "Your email address",
        copyright: "Global Love Ambassadors Initiative. All rights reserved.",
      },
      designTokens: {
        offWhite: "#FAFBF8",
        deepBlue: "#1E3A8A",
        teal: "#0D9488",
        hopeGreen: "#22C55E",
        sunshine: "#FBBF24",
        lightGray: "#F1F5F9",
      },
      social: [
        { platform: "X", href: "https://x.com" },
        { platform: "Instagram", href: "https://instagram.com" },
        { platform: "LinkedIn", href: "https://linkedin.com" },
        { platform: "YouTube", href: "https://youtube.com" },
      ],
      contact: {
        email: "hello@globalloveambassadors.org",
        pressEmail: "press@globalloveambassadors.org",
        phone: "+234 000 000 0000",
        address: "Lagos, Nigeria — with a growing global network",
      },
      defaultSeo: {
        title: "Global Love Ambassadors Initiative",
        description:
          "A global movement restoring love, unity, and peaceful coexistence. Join as a Love Ambassador, partner, or supporter.",
      },
      maintenanceMode: false,
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        languages: [
          { code: "en", name: "English", isDefault: true, isActive: true },
          { code: "fr", name: "Français", isActive: true },
          { code: "ar", name: "العربية", isActive: false },
          { code: "pt", name: "Português", isActive: false },
        ],
        navigation: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Our Work", href: "/our-work" },
          { label: "Stories & News", href: "/stories" },
          { label: "Podcast", href: "/podcast" },
          { label: "Impact", href: "/impact" },
          { label: "Love Ambassadors", href: "/love-ambassadors" },
          { label: "Get Involved", href: "/get-involved" },
          { label: "Resources", href: "/resources" },
        ],
        footer: {
          tagline:
            "A global movement of people committed to love, unity, peaceful coexistence, and collective progress.",
          columns: [
            {
              title: "Explore",
              links: [
                { label: "About", href: "/about" },
                { label: "Our Work", href: "/our-work" },
                { label: "Impact", href: "/impact" },
                { label: "Love Ambassadors", href: "/love-ambassadors" },
                { label: "Transparency", href: "/transparency" },
              ],
            },
            {
              title: "Participate",
              links: [
                { label: "Stories & News", href: "/stories" },
                { label: "Podcast", href: "/podcast" },
                { label: "Sign up", href: "/signup" },
                { label: "Volunteer", href: "/get-involved/volunteer" },
                { label: "Partner", href: "/get-involved/partner" },
                { label: "Events", href: "/events" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Donate", href: "/donate" },
                { label: "Sponsor a program", href: "/donate#sponsor" },
                { label: "Contact", href: "/contact" },
                { label: "FAQ", href: "/faq" },
              ],
            },
          ],
          legalLinks: [
            { label: "Terms of Use", href: "/legal/terms" },
            { label: "Privacy Policy", href: "/legal/privacy" },
            { label: "Cookie Policy", href: "/legal/cookies" },
            { label: "Accessibility", href: "/legal/accessibility" },
          ],
          newsletterLabel: "Stay connected",
          newsletterPlaceholder: "Your email address",
          copyright: "Global Love Ambassadors Initiative. All rights reserved.",
        },
        updatedAt: new Date(),
      },
    });

  const programRows = await db
    .insert(programs)
    .values([
      {
        slug: "love-ambassador-training",
        name: "Love Ambassador Training",
        shortDescription:
          "Form people who live by love and carry a message of unity into their communities.",
        purpose:
          "Equip participants with the principles, skills, and pastoral courage to become Love Ambassadors — people who live by love and carry that message globally.",
        whoCanParticipate:
          "Anyone 18 and older who is willing to live by the Ambassador principles, regardless of faith, ethnicity, or nationality.",
        curriculum: [
          "Foundations of love as a public ethic",
          "Listening across difference",
          "Dialogue facilitation",
          "Community action design",
          "Safeguarding and code of conduct",
          "Informed citizenship — rights, records, and nonpartisan choice",
        ],
        process:
          "Apply → review → cohort onboarding → five training modules → practicum → certification.",
        outcomes:
          "Graduates are recognized Love Ambassadors, eligible for the member portal, network directory (with consent), and community assignments.",
        applyCtaLabel: "Apply to train",
        applyHref: "/signup",
        featuredImageUrl: `${SAMPLE}/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80`,
        sortOrder: 1,
        status: "published",
      },
      {
        slug: "unity-dialogue-series",
        name: "Unity Dialogue Series",
        shortDescription:
          "Structured conversations that help divided communities listen, speak, and stay at the table.",
        purpose:
          "Create facilitated public dialogues that reduce religious, ethnic, and political polarization.",
        whoCanParticipate:
          "Community leaders, youth, faith groups, and institutions committed to non-violent engagement.",
        curriculum: [],
        process:
          "Host communities propose a dialogue → GLAI designs the format → trained facilitators convene → outcomes are documented.",
        outcomes:
          "Documented agreements, follow-up actions, and a public record of who was in the room.",
        applyCtaLabel: "Host a dialogue",
        applyHref: "/get-involved/partner",
        featuredImageUrl: `${SAMPLE}/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80`,
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sortOrder: 2,
        status: "published",
      },
      {
        slug: "love-in-action",
        name: "Love in Action",
        shortDescription:
          "Practical service that makes love visible — food, dignity, and community care.",
        purpose:
          "Translate the movement into tangible humanitarian and community-development work.",
        whoCanParticipate: "Ambassadors, volunteers, local partners, and sponsors.",
        curriculum: [],
        process: "Identify a local need → design a time-bound action → deliver with partners → report outcomes.",
        outcomes: "Families reached, volunteers mobilized, and public case studies in the Impact Portfolio.",
        applyCtaLabel: "Support this work",
        applyHref: "/donate",
        featuredImageUrl: `${SAMPLE}/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80`,
        sortOrder: 3,
        status: "published",
      },
      {
        slug: "spread-the-love",
        name: "#SpreadTheLove",
        shortDescription:
          "A public campaign inviting people everywhere to practice and share acts of love.",
        purpose:
          "Use culture, media, and digital organizing to normalize love as a civic practice.",
        whoCanParticipate: "Anyone with a story, a camera, or a community to gather.",
        curriculum: [],
        process: "Annual campaign brief → ambassador activations → public storytelling → impact recap.",
        outcomes: "Campaign stories, ambassador actions, and a public archive of the year’s work.",
        applyCtaLabel: "Join the campaign",
        applyHref: "/signup",
        featuredImageUrl: `${SAMPLE}/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1600&q=80`,
        sortOrder: 4,
        status: "published",
      },
      {
        slug: "global-love-day",
        name: "Global Love Day",
        shortDescription:
          "A shared annual moment for communities worldwide to gather, celebrate, and commit.",
        purpose:
          "Give the movement a calendar — one day when Love Ambassadors and partners act in concert.",
        whoCanParticipate: "Local chapters, institutions, schools, and the public.",
        curriculum: [],
        process: "Publish the year’s theme → local hosts register events → Global Love Day → reports and gallery.",
        outcomes: "A coordinated global day of events, documented in the Events platform.",
        applyCtaLabel: "Host an event",
        applyHref: "/events",
        featuredImageUrl: `${SAMPLE}/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80`,
        sortOrder: 5,
        status: "published",
      },
    ])
    .onConflictDoNothing({ target: programs.slug })
    .returning();

  const civicEducation = {
    slug: "civic-education",
    name: "Civic Education",
    shortDescription:
      "Nonpartisan political education so citizens know their rights, can test a promise, and choose leaders for themselves.",
    purpose:
      "Help citizens identify fraudulent or incompetent leadership and qualified public-interest leadership — without GLAI projecting, funding, or campaigning for any candidate or party. The work confronts political marginalization, corruption, unhealthy nepotism, and fake campaign promises through politically neutral sensitization.",
    whoCanParticipate:
      "Adults, community groups, campuses, and faith communities. Party membership is neither required nor useful. GLAI does not accept partisan briefing or candidate materials.",
    curriculum: [
      "Citizens’ rights and public duty",
      "How to read a campaign promise against a record",
      "Spotting corruption, nepotism, and patronage",
      "Political marginalization — who is locked out, and why it matters",
      "Criteria for judging candidates without being told who to choose",
      "Running a politically neutral sensitization",
    ],
    process:
      "A community or ambassador requests a session → GLAI supplies a nonpartisan brief → facilitators convene citizens to discuss rights and criteria, not named candidates → outcomes are documented without endorsements.",
    outcomes:
      "Citizens who can name their rights, test a promise, and choose for themselves. No candidate lists. No party materials. Public sessions belong in the Impact Portfolio when they can be verified.",
    applyCtaLabel: "Host a civic session",
    applyHref: "/get-involved/partner",
    featuredImageUrl: `${SAMPLE}/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80`,
    sortOrder: 6,
    status: "published" as const,
  };

  await db
    .insert(programs)
    .values(civicEducation)
    .onConflictDoUpdate({
      target: programs.slug,
      set: {
        name: civicEducation.name,
        shortDescription: civicEducation.shortDescription,
        purpose: civicEducation.purpose,
        whoCanParticipate: civicEducation.whoCanParticipate,
        curriculum: civicEducation.curriculum,
        process: civicEducation.process,
        outcomes: civicEducation.outcomes,
        applyCtaLabel: civicEducation.applyCtaLabel,
        applyHref: civicEducation.applyHref,
        featuredImageUrl: civicEducation.featuredImageUrl,
        sortOrder: civicEducation.sortOrder,
        status: civicEducation.status,
        updatedAt: new Date(),
      },
    });

  await db
    .update(programs)
    .set({
      curriculum: [
        "Foundations of love as a public ethic",
        "Listening across difference",
        "Dialogue facilitation",
        "Community action design",
        "Safeguarding and code of conduct",
        "Informed citizenship — rights, records, and nonpartisan choice",
      ],
      updatedAt: new Date(),
    })
    .where(eq(programs.slug, "love-ambassador-training"));

  const programBySlug = Object.fromEntries(
    (await db.select().from(programs)).map((row) => [row.slug, row]),
  );

  await db
    .insert(projects)
    .values([
      {
        slug: "dialogue-across-the-divide",
        title: "Dialogue Across the Divide",
        focusArea: "dialogue",
        location: "Jos, Plateau State",
        country: "Nigeria",
        countryCode: "NG",
        occurredOn: new Date("2025-11-12"),
        challenge:
          "Two neighbouring communities had stopped sharing markets and schools after a season of rumour and reprisal.",
        actionsTaken:
          "Love Ambassadors convened a facilitated Unity Dialogue with youth, elders, and faith leaders, then followed with a joint community service day.",
        peopleReached: null,
        partners: ["Local peace committee", "Youth forum"],
        sponsors: [],
        featuredImageUrl: `${SAMPLE}/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1600&q=80`,
        programId: programBySlug["unity-dialogue-series"]?.id,
        status: "published",
        lastUpdated: new Date("2026-03-01"),
      },
      {
        slug: "operation-feed-families",
        title: "Love in Action: Family Support Drive",
        focusArea: "humanitarian_action",
        location: "Lagos",
        country: "Nigeria",
        countryCode: "NG",
        occurredOn: new Date("2026-01-20"),
        challenge:
          "Households in a peri-urban settlement faced acute food insecurity after flooding.",
        actionsTaken:
          "Ambassadors and volunteers packed and delivered food kits with local partners, and documented needs for a follow-on livelihood referral.",
        partners: ["Community association"],
        sponsors: [],
        featuredImageUrl: `${SAMPLE}/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1600&q=80`,
        programId: programBySlug["love-in-action"]?.id,
        status: "published",
        lastUpdated: new Date("2026-02-15"),
      },
      {
        slug: "youth-peace-fellows",
        title: "Youth Peace Fellows Cohort",
        focusArea: "youth_engagement",
        location: "Accra",
        country: "Ghana",
        countryCode: "GH",
        occurredOn: new Date("2025-08-01"),
        challenge:
          "Young leaders wanted structured training before taking dialogue work into their campuses.",
        actionsTaken:
          "A Love Ambassador Training cohort ran five modules with a practicum on campus dialogue.",
        partners: ["Campus fellowship network"],
        featuredImageUrl: `${SAMPLE}/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1600&q=80`,
        programId: programBySlug["love-ambassador-training"]?.id,
        status: "published",
        lastUpdated: new Date("2026-01-10"),
      },
      {
        slug: "citizens-briefing-enugu",
        title: "Citizens’ briefing: how to read a campaign promise",
        focusArea: "education",
        location: "Enugu",
        country: "Nigeria",
        countryCode: "NG",
        occurredOn: new Date("2026-02-08"),
        challenge:
          "Voters in the community were being asked to choose without a public way to test slogans against a record, and without a room that stayed nonpartisan.",
        actionsTaken:
          "Love Ambassadors hosted a Civic Education briefing on rights, empty promises, corruption, and nepotism. Facilitators named criteria, not candidates. No party materials were admitted.",
        partners: ["Community youth forum"],
        featuredImageUrl: `${SAMPLE}/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80`,
        programId: programBySlug["civic-education"]?.id,
        status: "published",
        lastUpdated: new Date("2026-03-01"),
      },
    ])
    .onConflictDoNothing({ target: projects.slug });

  const projectRows = await db.select().from(projects);
  const projectBySlug = Object.fromEntries(projectRows.map((row) => [row.slug, row]));

  await db
    .insert(stories)
    .values([
      {
        slug: "from-division-to-dialogue",
        title: "From Division to Dialogue: How Young Leaders Brought Two Communities Together",
        category: "stories_of_change",
        excerpt:
          "When rumours closed a shared market, a small group of Love Ambassadors asked a different question: who is still willing to sit together?",
        body: `When the market closed, it was not because of a single incident. It was because people stopped believing they would be safe with one another.

A cohort of Love Ambassadors in Plateau State spent three weeks listening before they convened anyone. They mapped who still had relationships across the divide — traders, teachers, a football coach — and asked those people to help design the room.

The first dialogue did not produce a communique. It produced an agreement to meet again, and a joint decision to reopen a single stall as a test. That stall is still open.

This account is seed content for the editorial system. Replace it with a verified GLAI story, real names (with consent), and photographs from the media library.`,
        featuredImageUrl: `${SAMPLE}/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80`,
        authorName: "GLAI Editorial",
        programId: programBySlug["unity-dialogue-series"]?.id,
        projectId: projectBySlug["dialogue-across-the-divide"]?.id,
        status: "published",
        publishedAt: new Date("2026-03-12"),
        seoTitle: "From Division to Dialogue | GLAI Stories",
        seoDescription:
          "Young Love Ambassadors in Plateau State helped two communities return to a shared market through facilitated dialogue.",
      },
      {
        slug: "ambassador-training-opens-2026",
        title: "2026 Love Ambassador Training cohorts are open",
        category: "news",
        excerpt:
          "Applications are open for the next training cohorts. Training remains the doorway into the Ambassador portal.",
        body: `The Love Ambassador Training Program remains the primary pathway into GLAI membership.

Applicants complete a public form. Applications are reviewed by the membership team. Approved applicants receive portal access, a training plan, and a place in the global network count.

This news item is sample CMS content and should be updated with verified cohort dates before public launch.`,
        featuredImageUrl: `${SAMPLE}/photo-1524178232363-1fbdb6e5cf8c?auto=format&fit=crop&w=1600&q=80`,
        authorName: "GLAI Communications",
        programId: programBySlug["love-ambassador-training"]?.id,
        status: "published",
        publishedAt: new Date("2026-04-02"),
      },
      {
        slug: "spread-the-love-campaign-note",
        title: "#SpreadTheLove: a campaign built from ordinary courage",
        category: "campaigns",
        excerpt:
          "The campaign is not a slogan. It is a request: practice love in public, then tell the truth about what happened.",
        body: `Every year GLAI invites Ambassadors and the public to document acts of repair — a meal shared, a rumour interrupted, a neighbour defended.

Stories are collected through the Stories & News system and tagged to the campaign. Nothing is published without editorial review, and nothing involving minors is published without a safeguarding check.

Replace this sample with the live 2026 campaign brief.`,
        featuredImageUrl: `${SAMPLE}/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80`,
        status: "published",
        publishedAt: new Date("2026-02-14"),
      },
      {
        slug: "draft-internal-brief",
        title: "Internal brief: Q3 editorial calendar (draft)",
        category: "news",
        excerpt: "This draft must never appear on the public site.",
        body: "Draft content used to verify that unpublished stories are hidden from public listing and detail routes.",
        status: "draft",
      },
    ])
    .onConflictDoNothing({ target: stories.slug });

  await db
    .insert(events)
    .values([
      {
        slug: "unity-dialogue-september",
        title: "Unity Dialogue — Community Listening Session",
        startsAt: new Date("2026-09-18T10:00:00+01:00"),
        endsAt: new Date("2026-09-18T16:00:00+01:00"),
        timezone: "Africa/Lagos",
        venueName: "Community Hall",
        city: "Lagos",
        country: "Nigeria",
        countryCode: "NG",
        speakers: [
          { name: "Facilitation team", title: "GLAI trained facilitators" },
        ],
        description:
          "A facilitated public dialogue on coexistence in the city. Registration is free; capacity is limited so that the room can actually listen.",
        capacity: 80,
        registrationType: "free",
        featuredImageUrl: `${SAMPLE}/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80`,
        programId: programBySlug["unity-dialogue-series"]?.id,
        status: "published",
      },
      {
        slug: "global-love-day-2026",
        title: "Global Love Day 2026",
        startsAt: new Date("2026-05-01T09:00:00+01:00"),
        endsAt: new Date("2026-05-01T18:00:00+01:00"),
        timezone: "Africa/Lagos",
        city: "Multiple cities",
        country: "International",
        countryCode: "INT",
        isOnline: true,
        speakers: [],
        description:
          "A coordinated day of local gatherings. This past event holds the gallery and post-event report pattern.",
        registrationType: "closed",
        postEventReport:
          "Local hosts ran gatherings in several cities. Replace this seed report with the verified 2026 recap, attendance, and media.",
        featuredImageUrl: `${SAMPLE}/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80`,
        programId: programBySlug["global-love-day"]?.id,
        status: "published",
      },
    ])
    .onConflictDoNothing({ target: events.slug });

  await db
    .insert(trainingModules)
    .values([
      { title: "Love as a public ethic", description: "Why love is a civic practice, not a private feeling.", sortOrder: 1 },
      { title: "Listening across difference", description: "Tools for staying in the room when identity is charged.", sortOrder: 2 },
      { title: "Dialogue facilitation", description: "How to convene, hold, and close a public conversation.", sortOrder: 3 },
      { title: "Community action design", description: "Turning a dialogue into a time-bound act of service.", sortOrder: 4 },
      { title: "Safeguarding and conduct", description: "The code of conduct, consent, and care for the vulnerable.", sortOrder: 5 },
    ])
    .onConflictDoNothing();

  const existingModuleTitles = new Set((await db.select({ title: trainingModules.title }).from(trainingModules)).map((row) => row.title));
  if (!existingModuleTitles.has("Informed citizenship")) {
    await db.insert(trainingModules).values({
      title: "Informed citizenship",
      description: "Rights, records, and nonpartisan choice — how to judge leadership without being told who to choose.",
      sortOrder: 6,
    });
  }

  const modules = await db.select().from(trainingModules);

  await db
    .insert(ambassadors)
    .values([
      {
        userId: ambassadorUser.id,
        fullName: "Ada Okonkwo",
        email: "ada.okonkwo@example.org",
        phone: "+234800000001",
        country: "Nigeria",
        countryCode: "NG",
        nationality: "Nigeria",
        stateOfOrigin: "Lagos",
        localGovernment: "Ikeja",
        geoPoliticalZone: "South West",
        region: "Lagos",
        profession: "Educator",
        areasOfInterest: ["dialogue", "youth"],
        whyJoin: "To train young people to stay in conversation across difference.",
        volunteerInterests: ["facilitation"],
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
        contributions: "Facilitated two campus listening sessions in 2025.",
      },
      {
        userId: networkUserByEmail["kwame.mensah@example.org"]?.id ?? null,
        fullName: "Kwame Mensah",
        email: "kwame.mensah@example.org",
        country: "Ghana",
        countryCode: "GH",
        region: "Greater Accra",
        profession: "Community organizer",
        whyJoin: "To connect GLAI training with neighbourhood peace work.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["amina.yusuf@example.org"]?.id ?? null,
        fullName: "Amina Yusuf",
        email: "amina.yusuf@example.org",
        country: "Kenya",
        countryCode: "KE",
        region: "Nairobi",
        profession: "Social worker",
        whyJoin: "To bring Love in Action methods to urban youth groups.",
        status: "active",
        consentToDirectory: false,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["lilian.mukamana@example.org"]?.id ?? null,
        fullName: "Lilian Mukamana",
        email: "lilian.mukamana@example.org",
        country: "Rwanda",
        countryCode: "RW",
        region: "Kigali",
        profession: "Youth mentor",
        whyJoin: "To grow practical listening skills among emerging leaders.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["thabo.dlamini@example.org"]?.id ?? null,
        fullName: "Thabo Dlamini",
        email: "thabo.dlamini@example.org",
        country: "South Africa",
        countryCode: "ZA",
        region: "Gauteng",
        profession: "Social entrepreneur",
        whyJoin: "To create more spaces for inclusive community action.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["nour.hassan@example.org"]?.id ?? null,
        fullName: "Nour Hassan",
        email: "nour.hassan@example.org",
        country: "Egypt",
        countryCode: "EG",
        region: "Cairo",
        profession: "Mediator",
        whyJoin: "To advance respectful dialogue between communities.",
        status: "active",
        consentToDirectory: false,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["fatou.diallo@example.org"]?.id ?? null,
        fullName: "Fatou Diallo",
        email: "fatou.diallo@example.org",
        country: "Senegal",
        countryCode: "SN",
        region: "Dakar",
        profession: "Communications specialist",
        whyJoin: "To connect youth-led stories of unity across borders.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["samuel.okello@example.org"]?.id ?? null,
        fullName: "Samuel Okello",
        email: "samuel.okello@example.org",
        country: "Uganda",
        countryCode: "UG",
        region: "Kampala",
        profession: "Community health worker",
        whyJoin: "To make service and solidarity visible in everyday life.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["ibrahim.bello@example.org"]?.id ?? null,
        fullName: "Ibrahim Bello",
        email: "ibrahim.bello@example.org",
        country: "Nigeria",
        countryCode: "NG",
        nationality: "Nigeria",
        stateOfOrigin: "Kano",
        localGovernment: "Kano Municipal",
        geoPoliticalZone: "North West",
        region: "Kano",
        profession: "Trader",
        whyJoin: "To carry Love in Action into markets and neighbourhood associations.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
      {
        userId: networkUserByEmail["chioma.eze@example.org"]?.id ?? null,
        fullName: "Chioma Eze",
        email: "chioma.eze@example.org",
        country: "Nigeria",
        countryCode: "NG",
        nationality: "Nigeria",
        stateOfOrigin: "Enugu",
        localGovernment: "Enugu North",
        geoPoliticalZone: "South East",
        region: "Enugu",
        profession: "Nurse",
        whyJoin: "To practise listening and care across difference in daily work.",
        status: "active",
        consentToDirectory: true,
        principlesAgreedAt: new Date(),
      },
    ])
    .onConflictDoNothing({ target: ambassadors.email });

  const ada = (await db.select().from(ambassadors).where(eq(ambassadors.email, "ada.okonkwo@example.org")))[0];
  if (ada && modules.length) {
    await db
      .insert(ambassadorTrainingProgress)
      .values(
        modules.slice(0, 3).map((mod) => ({
          ambassadorId: ada.id,
          moduleId: mod.id,
        })),
      )
      .onConflictDoNothing();
    await db
      .insert(certificates)
      .values({
        ambassadorId: ada.id,
        title: "Love Ambassador — Foundations",
        issuedAt: new Date("2025-12-01"),
      })
      .onConflictDoNothing();
  }

  await db
    .insert(campaigns)
    .values([
      {
        slug: "general-fund",
        name: "Support the mission",
        description: "Unrestricted giving that lets GLAI train Ambassadors, convene dialogues, and act where the need is greatest.",
        currency: "NGN",
        status: "published",
      },
      {
        slug: "sponsor-ambassador-training",
        name: "Sponsor Ambassador Training",
        description: "Underwrite a training cohort so more people can complete the pathway into the movement.",
        programId: programBySlug["love-ambassador-training"]?.id,
        currency: "NGN",
        status: "published",
      },
      {
        slug: "sponsor-love-in-action",
        name: "Sponsor Love in Action",
        description: "Fund community actions that make love visible in food, dignity, and care.",
        programId: programBySlug["love-in-action"]?.id,
        currency: "NGN",
        status: "published",
      },
      {
        slug: "sponsor-civic-education",
        name: "Sponsor Civic Education",
        description: "Underwrite nonpartisan political sensitizations so citizens can judge a record for themselves.",
        programId: programBySlug["civic-education"]?.id,
        currency: "NGN",
        status: "published",
      },
    ])
    .onConflictDoNothing({ target: campaigns.slug });

  await db
    .insert(volunteerOpportunities)
    .values([
      {
        slug: "dialogue-stewards",
        title: "Dialogue stewards",
        description: "Help set a room, welcome guests, and support facilitators at Unity Dialogue events.",
        location: "Lagos and rotating cities",
        slots: 10,
        status: "published",
        publishedAt: new Date(),
      },
      {
        slug: "media-documentarians",
        title: "Field documentarians",
        description: "Photograph and write, with consent, so the Impact Portfolio can show real work.",
        location: "Assignment-based",
        slots: 8,
        status: "published",
        publishedAt: new Date(),
      },
      {
        slug: "civic-education-stewards",
        title: "Civic education stewards",
        description:
          "Help host politically neutral briefings: welcome guests, keep party materials out of the room, and support facilitators.",
        location: "Rotating cities",
        slots: 12,
        status: "published",
        publishedAt: new Date(),
      },
    ])
    .onConflictDoNothing({ target: volunteerOpportunities.slug });

  await db
    .insert(people)
    .values([
      {
        name: "Dr. Eniola Biodun",
        position: "Chair, Board of Trustees",
        group: "board",
        bio: "PhD in Public Policy, with 20 years of experience in governance and nonprofit leadership. Dr. Biodun has served on multiple boards and is committed to advancing civic engagement and social responsibility.",
        responsibility: "Governance and fiduciary oversight",
        sortOrder: 1,
        status: "published",
      },
      {
        name: "Engr. Usman Abubakar",
        position: "Executive Director",
        group: "executive",
        bio: "Engr. Usman Abubakar is the Executive Director of GLAI, with over 15 years of experience in project management and organizational development. He is dedicated to driving the organization's mission and ensuring its strategic goals are met.",
        responsibility: "Strategy, programs, and institutional partnerships",
        sortOrder: 1,
        status: "published",
      },
    ])
    .onConflictDoUpdate({
      target: [people.name, people.position],
      set: {
        group: sql`excluded.group`,
        bio: sql`excluded.bio`,
        responsibility: sql`excluded.responsibility`,
        sortOrder: sql`excluded.sort_order`,
        status: sql`excluded.status`,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(impactStats)
    .values([
      {
        key: "people_reached",
        label: "People reached",
        valueDisplay: "Pending verification",
        numericValue: null,
        source: "Do not display a number until GLAI supplies a verified figure.",
        lastUpdated: new Date("2026-09-01"),
        sortOrder: 1,
      },
      {
        key: "ambassadors_trained",
        label: "Love Ambassadors trained",
        valueDisplay: "Pending verification",
        numericValue: null,
        source: "Network totals will be computed from approved ambassador records once historical data is imported.",
        lastUpdated: new Date("2026-09-01"),
        sortOrder: 2,
      },
      {
        key: "community_initiatives",
        label: "Community initiatives",
        valueDisplay: "Pending verification",
        numericValue: null,
        source: "Count from published Impact Portfolio entries.",
        lastUpdated: new Date("2026-09-01"),
        sortOrder: 3,
      },
    ])
    .onConflictDoNothing({ target: impactStats.key });

  await db
    .insert(faqItems)
    .values([
      {
        question: "Who can become a Love Ambassador?",
        answer:
          "Anyone 18 or older who agrees to the Ambassador principles and completes the application and review process.",
        audience: "ambassadors",
        sortOrder: 1,
        status: "published",
      },
      {
        question: "How are donations used?",
        answer:
          "Gifts support training, dialogues, Love in Action projects, and the core operations that keep the movement accountable. Financial reports live in the Transparency Center.",
        audience: "donors",
        sortOrder: 2,
        status: "published",
      },
      {
        question: "How can an institution partner with GLAI?",
        answer:
          "Use the Partner pathway under Get Involved. Institutional conversations are handled separately from individual giving.",
        audience: "partners",
        sortOrder: 3,
        status: "published",
      },
      {
        question: "Where can journalists verify GLAI’s legal status?",
        answer:
          "The Transparency & Credibility Center publishes registration, governance, policies, and reports as they are supplied by GLAI.",
        audience: "media",
        sortOrder: 4,
        status: "published",
      },
    ])
    .onConflictDoNothing();

  const civicFaqs = [
    {
      question: "Does GLAI endorse candidates or political parties?",
      answer:
        "No. GLAI does not project, fund, or campaign for any candidate or party. Civic education helps citizens recognize fraudulent or incompetent leadership, recognize qualified public-interest leadership, and then make their own informed decisions.",
      audience: "general",
      sortOrder: 5,
      status: "published" as const,
    },
    {
      question: "If GLAI is a humanitarian NGO, why does it talk about politics?",
      answer:
        "Because political marginalization, corruption, unhealthy nepotism, and fake campaign promises harm the same communities GLAI serves. The response is politically neutral sensitization — rights, records, and criteria — not a GLAI-endorsed list.",
      audience: "general",
      sortOrder: 6,
      status: "published" as const,
    },
  ];
  const existingFaqQuestions = new Set((await db.select({ question: faqItems.question }).from(faqItems)).map((row) => row.question));
  const faqsToInsert = civicFaqs.filter((item) => !existingFaqQuestions.has(item.question));
  if (faqsToInsert.length) {
    await db.insert(faqItems).values(faqsToInsert);
  }

  const templates: { type: string; subject: string; body: string }[] = [
    {
      type: "application_received",
      subject: "We received your Love Ambassador application",
      body: "Dear {{name}},\n\nThank you for applying to become a Love Ambassador. Our team will review your application and write to you at this address.\n\nWith respect,\nGLAI",
    },
    {
      type: "application_approved",
      subject: "Your Love Ambassador application has been approved",
      body: "Dear {{name}},\n\nYour application has been approved. Create your portal password using this link: {{resetUrl}}\n\nWelcome to the movement.\nGLAI",
    },
    {
      type: "welcome_glai",
      subject: "Welcome to GLAI",
      body: "Dear {{name}},\n\nYou now have access to the Ambassador dashboard. Begin with your training modules and update your public-directory consent.\n\nGLAI",
    },
    {
      type: "event_registration",
      subject: "Registration confirmed: {{eventTitle}}",
      body: "Dear {{name}},\n\nYou are registered for {{eventTitle}} on {{eventDate}}. If the event is full you will be waitlisted and notified.\n\nGLAI",
    },
    {
      type: "event_reminder",
      subject: "Reminder: {{eventTitle}}",
      body: "Dear {{name}},\n\nThis is a reminder that {{eventTitle}} begins on {{eventDate}}.\n\nGLAI",
    },
    {
      type: "event_update",
      subject: "Update: {{eventTitle}}",
      body: "Dear {{name}},\n\n{{message}}\n\nGLAI",
    },
    {
      type: "donation_confirmation",
      subject: "Thank you for supporting GLAI",
      body: "Dear {{name}},\n\nWe received your {{frequency}} gift of {{amount}} {{currency}}. Your receipt is available at {{receiptUrl}}.\n\nGLAI",
    },
    {
      type: "donation_receipt",
      subject: "Your GLAI donation receipt",
      body: "Dear {{name}},\n\nReceipt {{receiptId}} for {{amount}} {{currency}} is attached as a downloadable page: {{receiptUrl}}.\n\nGLAI",
    },
    {
      type: "volunteer_received",
      subject: "We received your volunteer application",
      body: "Dear {{name}},\n\nThank you for offering your time. We will review your application and follow up.\n\nGLAI",
    },
    {
      type: "volunteer_accepted",
      subject: "Your volunteer application has been accepted",
      body: "Dear {{name}},\n\nYou have been accepted for {{opportunity}}. Our team will share next steps shortly.\n\nGLAI",
    },
    {
      type: "training_available",
      subject: "A training module is ready for you",
      body: "Dear {{name}},\n\n{{moduleTitle}} is now available in your dashboard.\n\nGLAI",
    },
    {
      type: "certificate_issued",
      subject: "A certificate has been issued",
      body: "Dear {{name}},\n\n{{certificateTitle}} is now in your dashboard.\n\nGLAI",
    },
    {
      type: "campaign_launched",
      subject: "A new campaign is live: {{campaignName}}",
      body: "Dear {{name}},\n\n{{campaignName}} is now live. Visit {{campaignUrl}} to take part.\n\nGLAI",
    },
  ];

  for (const template of templates) {
    await db
      .insert(notificationTemplates)
      .values(template)
      .onConflictDoUpdate({
        target: [notificationTemplates.type, notificationTemplates.locale],
        set: { subject: template.subject, body: template.body, updatedAt: new Date() },
      });
  }

  const pageSeed: {
    slug: string;
    title: string;
    description: string;
    blocks: { type: "hero" | "problem" | "stat_strip" | "card_grid" | "cta_banner" | "donate" | "stories" | "rich_text" | "people" | "faq"; data: Record<string, unknown> }[];
  }[] = [
    {
      slug: "home",
      title: "Home",
      description: "Humanity Above Differences — restoring love in a divided world.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Global Love Ambassadors Initiative",
            headline: "Humanity Above Differences — Restoring love in a divided world.",
            subheadline:
              "We are building a global movement of people committed to love, unity, peaceful coexistence, and collective progress — including the civic courage to refuse corruption, patronage, and empty promises.",
            primaryLabel: "Become a Love Ambassador",
            primaryHref: "/love-ambassadors",
            secondaryLabel: "Support Our Mission",
            secondaryHref: "/donate",
            imageUrl: `${SAMPLE}/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80`,
          },
        },
        {
          type: "problem",
          data: {
            heading: "The fractures we refuse to accept",
            intro:
              "GLAI exists because division is being practiced in public — and love is not. These are the conditions the movement is built to confront.",
            items: [
              { title: "Religious division", body: "Communities taught to fear the faith of their neighbours." },
              { title: "Tribal and ethnic conflict", body: "Identity used as a weapon instead of a heritage." },
              { title: "Political polarization", body: "Public life reduced to camps that cannot share a table." },
              { title: "Hate speech", body: "Language that prepares the ground for violence." },
              { title: "Corruption and nepotism", body: "Public office treated as private property, and loyalty rewarded over competence." },
              { title: "Political marginalization", body: "Citizens locked out of voice, rights, and the chance to judge a record for themselves." },
            ],
          },
        },
        {
          type: "card_grid",
          data: {
            heading: "What we do",
            source: "programs",
          },
        },
        {
          type: "stat_strip",
          data: {
            heading: "Our impact",
            note: "Figures appear only when GLAI has verified them. Until then the dashboard shows pending values, not invented ones.",
          },
        },
        {
          type: "stories",
          data: { heading: "Stories of change", limit: 3 },
        },
        {
          type: "cta_banner",
          data: {
            heading: "Become part of the movement",
            items: [
              { title: "Become an Ambassador", href: "/love-ambassadors", body: "Train, serve, and join a global network." },
              { title: "Volunteer", href: "/get-involved/volunteer", body: "Give time to dialogues, actions, and documentation." },
              { title: "Partner", href: "/get-involved/partner", body: "Build institutional work with GLAI." },
            ],
          },
        },
        {
          type: "donate",
          data: {
            heading: "Support the work",
            body: "Give once or monthly. Every gift is receipted. Recurring gifts can be paused or cancelled without calling an office.",
            href: "/donate",
            label: "Give now",
          },
        },
      ],
    },
    {
      slug: "about",
      title: "About GLAI",
      description: "Mission, vision, theory of change, and the institutional story.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "About",
            headline: "A movement people can trust, join, support, and participate in.",
            subheadline:
              "GLAI is not only a set of projects. It exists to raise Love Ambassadors, create dialogue, mobilize communities, run campaigns, and build a lasting global movement.",
            primaryLabel: "Read the Transparency Center",
            primaryHref: "/transparency",
            secondaryLabel: "Our work",
            secondaryHref: "/our-work",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "Mission",
            body: "To restore love in a divided world by forming people and communities who choose humanity above differences — in public, not only in private.",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "Vision",
            body: "A world in which love, unity, peaceful coexistence, and collective progress are practiced as ordinary civic life.",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "Theory of change",
            body: "If we train Love Ambassadors, convene honest dialogue, and make love visible through action and campaign, then communities can interrupt cycles of distrust — and institutions can fund and verify that work. Training changes people. Dialogue changes rooms. Action changes conditions. Transparency keeps the whole of it accountable.",
          },
        },
      ],
    },
    {
      slug: "our-work",
      title: "Our Work",
      description: "Programs that turn love from a private feeling into public practice — including nonpartisan civic education.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Programs",
            headline: "What we do, in public.",
            subheadline:
              "Training, dialogue, humanitarian action, civic education, cultural campaign, and a shared global day — each program is a doorway into the movement.",
            primaryLabel: "Become a Love Ambassador",
            primaryHref: "/love-ambassadors",
            secondaryLabel: "Support a program",
            secondaryHref: "/donate",
          },
        },
        {
          type: "card_grid",
          data: { heading: "Programs", source: "programs" },
        },
      ],
    },
    {
      slug: "impact",
      title: "Impact",
      description: "Case studies and verified figures — never invented for visual effect.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Impact Portfolio",
            headline: "Work that can be named, located, and checked.",
            subheadline:
              "Every project records a challenge, the actions taken, and partners. Headline statistics stay at “Pending verification” until GLAI supplies a figure.",
            primaryLabel: "Read stories of change",
            primaryHref: "/stories",
            secondaryLabel: "Transparency Center",
            secondaryHref: "/transparency",
          },
        },
        {
          type: "stat_strip",
          data: {
            heading: "Headline figures",
            note: "Figures appear only when GLAI has verified them.",
          },
        },
      ],
    },
    {
      slug: "get-involved",
      title: "Get Involved",
      description: "Volunteer, partner, or sponsor a named program.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Participate",
            headline: "There is more than one way to stand with this work.",
            subheadline:
              "Give time as a volunteer, build an institutional partnership, or underwrite a named program.",
            primaryLabel: "Volunteer",
            primaryHref: "/get-involved/volunteer",
            secondaryLabel: "Partner with GLAI",
            secondaryHref: "/get-involved/partner",
          },
        },
        {
          type: "cta_banner",
          data: {
            heading: "Choose a pathway",
            items: [
              { title: "Volunteer", href: "/get-involved/volunteer", body: "Steward dialogues, document field work, and support Love in Action." },
              { title: "Partner", href: "/get-involved/partner", body: "Institutions, campuses, and faith communities can host and co-design." },
              { title: "Sponsor a program", href: "/donate#sponsor", body: "Underwrite training, dialogue, or humanitarian action." },
            ],
          },
        },
      ],
    },
    {
      slug: "get-involved/volunteer",
      title: "Volunteer",
      description: "Give time to dialogues, actions, and documentation.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Volunteer",
            headline: "The work needs people in the room, not only on a list.",
            subheadline:
              "Open roles are listed below. Applications are reviewed by the volunteer team; you will hear back at the email you provide.",
            primaryLabel: "Apply as a volunteer",
            primaryHref: "#apply",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "How volunteering works",
            body: "Choose an open role, tell us where you are and what you can offer, and wait for a confirmation. Acceptance is never automatic — safeguarding and capacity come first.",
          },
        },
      ],
    },
    {
      slug: "get-involved/partner",
      title: "Partner with GLAI",
      description: "Institutional collaboration with campuses, communities, and funders.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Partnerships",
            headline: "Build the work with us, not only around us.",
            subheadline:
              "GLAI partners with institutions that can host dialogues, co-deliver training, or fund a named program. Conversations are handled separately from individual giving.",
            primaryLabel: "Start a conversation",
            primaryHref: "/contact",
            secondaryLabel: "Sponsor a program",
            secondaryHref: "/donate#sponsor",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "What partnership looks like",
            body: "A partnership is a written understanding: who hosts, who facilitates, how safeguarding is held, and how outcomes are reported in the Impact Portfolio. Use the contact form with the topic “Partnership” to begin.",
          },
        },
      ],
    },
    {
      slug: "resources",
      title: "Resources",
      description: "Reports, policies, and a media kit as documents are supplied.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Resources",
            headline: "Documents the public and the press can actually use.",
            subheadline:
              "Reports, policies, and a media kit will live here as GLAI supplies them. Until then, the Transparency Center holds the institutional placeholders.",
            primaryLabel: "Transparency Center",
            primaryHref: "/transparency",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "Media kit",
            body: "Logo files, brand colours, and approved photographs will be published here. Journalists can write to press@globalloveambassadors.org in the meantime.",
          },
        },
      ],
    },
    {
      slug: "careers",
      title: "Careers & Opportunities",
      description: "Roles, fellowships, and how to work with GLAI.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Careers",
            headline: "Work that asks for courage and care.",
            subheadline:
              "Open roles will be listed here. Until a vacancy is published, the best pathways in are Love Ambassador training and volunteering.",
            primaryLabel: "Become an Ambassador",
            primaryHref: "/love-ambassadors",
            secondaryLabel: "Volunteer",
            secondaryHref: "/get-involved/volunteer",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "No open vacancies yet",
            body: "This page is ready for CMS-managed role listings. Replace this note when GLAI publishes a vacancy, fellowship, or consultancy.",
          },
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      description: "Write to GLAI — public, press, partnership, or safeguarding.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Contact",
            headline: "We read what you send.",
            subheadline:
              "Use the form for general, press, partnership, and safeguarding messages. Do not include payment-card details in email.",
            primaryLabel: "Send a message",
            primaryHref: "#contact-form",
          },
        },
      ],
    },
    {
      slug: "faq",
      title: "Frequently asked questions",
      description: "Straight answers for ambassadors, donors, partners, and the press.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "FAQ",
            headline: "Questions we are asked, answered in public.",
            subheadline: "Answers are stored in the CMS so they can be updated without a developer.",
          },
        },
        { type: "faq", data: { heading: "Questions" } },
      ],
    },
    {
      slug: "love-ambassadors",
      title: "Become a Love Ambassador",
      description: "Who can join, what Ambassadors do, and how the pathway works.",
      blocks: [
        {
          type: "hero",
          data: {
            kicker: "Love Ambassadors",
            headline: "People who live by love and carry the message globally.",
            subheadline:
              "Love Ambassadors are not a mailing list. They train, they serve, they are counted in a global network, and they appear in the public directory only with consent.",
            primaryLabel: "Sign up",
            primaryHref: "/signup",
            secondaryLabel: "View the network",
            secondaryHref: "/love-ambassadors/network",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "Who can become one",
            body: "Adults of any faith, ethnicity, or nationality who are willing to live by the Ambassador principles, complete training, and be accountable to the code of conduct.",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "What Ambassadors do",
            body: "They facilitate dialogue, serve in Love in Action, run politically neutral civic education, participate in campaigns such as #SpreadTheLove and Global Love Day, and represent the movement with dignity in their own communities. They do not campaign for candidates.",
          },
        },
        {
          type: "rich_text",
          data: {
            heading: "Principles, training, and recognition",
            body: "Sign up, confirm your WhatsApp number, and your membership dashboard opens immediately. There is no application review in between. From the dashboard you can take volunteer roles, follow active campaigns, and see upcoming events.",
          },
        },
      ],
    },
  ];

  for (const page of pageSeed) {
    const [existing] = await db.select().from(pages).where(eq(pages.slug, page.slug)).limit(1);
    const [saved] = existing
      ? [existing]
      : await db
          .insert(pages)
          .values({
            slug: page.slug,
            title: page.title,
            description: page.description,
            status: "published",
            publishedAt: new Date(),
            seoTitle: `${page.title} | GLAI`,
            seoDescription: page.description,
          })
          .returning();

    if (!existing) {
      await db.insert(pageBlocks).values(
        page.blocks.map((block, index) => ({
          pageId: saved.id,
          type: block.type,
          sortOrder: index,
          data: block.data,
        })),
      );
    }
  }

  const legalPages = [
    {
      slug: "legal/terms",
      title: "Terms of Use",
      body: "These terms govern use of the GLAI website and related services. Replace this seed text with counsel-approved terms before launch.",
    },
    {
      slug: "legal/privacy",
      title: "Privacy Policy",
      body: "GLAI collects ambassador, donor, volunteer, event-registration, and visitor information to operate the Love Ambassador programme, events, donations, and this website.\n\nWhat we store: account and ambassador profile details (name, email, country, optional phone); application answers and directory consent; donation records (name, email, amount, currency); volunteer and event registrations; messages sent through contact forms; a session cookie if you sign in; a language cookie; and analytics cookies only if you opt in.\n\nPayment card numbers never touch GLAI servers. The payment processor handles card data. Phone numbers are stored encrypted at the field level.\n\nRetention: ambassador and staff accounts while membership or employment is active, then 24 months after closure unless a longer legal duty applies; donation records 7 years for accounting; event and volunteer registrations 24 months after the event or assignment; contact messages 24 months; session cookies 14 days; language cookie 12 months.\n\nDeletion: use the contact form with the topic “Privacy / deletion”, or email the address on this page. Staff with the Users permission can fulfil a request in the admin panel. We redact personal fields, deactivate the account, and keep only what the law requires (for example donation amounts for accounting).\n\nSafeguarding: content that involves children or vulnerable people is not published until a named safeguarding review is recorded.\n\nReplace this seed with counsel-approved policy before launch if legal review requires different periods.",
    },
    {
      slug: "legal/cookies",
      title: "Cookie Policy",
      body: "Necessary cookies: glai_session keeps you signed in (14 days); glai_locale remembers the language you chose (12 months); glai_cookie_consent stores your analytics choice (12 months). These are required for the site to work as you asked.\n\nOptional analytics cookies load only after you choose “Accept analytics” on the cookie banner, and only when a measurement ID is configured. You can change your choice by clearing site cookies.\n\nReplace this seed with the approved cookie policy if counsel requires different wording.",
    },
    {
      slug: "legal/accessibility",
      title: "Accessibility Statement",
      body: "GLAI aims to meet WCAG 2.1 AA. If you encounter a barrier, write to hello@globalloveambassadors.org. Replace this seed with the approved statement.",
    },
    {
      slug: "transparency",
      title: "Transparency & Credibility Center",
      body: "This center will hold CAC registration, governance, board and executive profiles, annual and financial reports, safeguarding, code of conduct, procurement, conflict-of-interest, and partnership records. Seed pages are placeholders until GLAI supplies the documents.",
    },
  ];

  for (const page of legalPages) {
    const [existing] = await db.select().from(pages).where(eq(pages.slug, page.slug)).limit(1);
    if (existing) {
      const [block] = await db
        .select()
        .from(pageBlocks)
        .where(eq(pageBlocks.pageId, existing.id))
        .limit(1);
      const data = block?.data as { body?: string } | undefined;
      if (block && data?.body?.includes("Replace this seed")) {
        await db
          .update(pageBlocks)
          .set({ data: { heading: page.title, body: page.body } })
          .where(eq(pageBlocks.id, block.id));
      }
      continue;
    }
    const [saved] = await db
      .insert(pages)
      .values({
        slug: page.slug,
        title: page.title,
        description: page.title,
        status: "published",
        publishedAt: new Date(),
        seoTitle: `${page.title} | GLAI`,
        seoDescription: page.body.slice(0, 150),
      })
      .returning();
    await db.insert(pageBlocks).values({
      pageId: saved.id,
      type: "rich_text",
      sortOrder: 0,
      data: { heading: page.title, body: page.body },
    });
  }

  const [frenchHome] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, "home"), eq(pages.locale, "fr")))
    .limit(1);
  if (!frenchHome) {
    const [saved] = await db
      .insert(pages)
      .values({
        slug: "home",
        locale: "fr",
        title: "Initiative mondiale des Ambassadeurs de l'Amour",
        description:
          "Page d'essai en français. Le contenu complet sera fourni par GLAI — cette entrée existe pour vérifier le changement de langue sans déploiement de code.",
        status: "published",
        publishedAt: new Date(),
        seoTitle: "GLAI — accueil (français)",
        seoDescription:
          "Page d'essai pour vérifier qu'une langue s'ajoute depuis le CMS, sans modifier le code.",
      })
      .returning();
    await db.insert(pageBlocks).values({
      pageId: saved.id,
      type: "hero",
      sortOrder: 0,
      data: {
        kicker: "Essai de langue",
        headline: "Une page d'accueil en français.",
        subheadline:
          "Activez ou désactivez le français dans les paramètres du site. Cette page prouve qu'une langue s'ajoute sans modifier le code.",
        primaryLabel: "Devenir ambassadeur",
        primaryHref: "/love-ambassadors",
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Primary admin login: ${primaryAdminEmail}`);
  console.log("Ambassador login: ada.okonkwo@example.org / Ambassador!2026");
  await getSql().end({ timeout: 5 });
}

seed().catch(async (error) => {
  console.error(error);
  try {
    await getSql().end({ timeout: 5 });
  } catch {
    // ignore
  }
  process.exit(1);
});
