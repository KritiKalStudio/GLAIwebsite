export const legalPages = {
  terms: {
    title: "Terms of Use",
    description: "Terms that govern use of the GLAI website and related services.",
    body: "These terms govern use of the GLAI website and related services. Replace this seed text with counsel-approved terms before launch.",
  },
  privacy: {
    title: "Privacy Policy",
    description: "How GLAI collects, stores, and deletes personal information.",
    body: `GLAI collects ambassador, donor, volunteer, event-registration, and visitor information to operate the Love Ambassador programme, events, donations, and this website.

What we store: account and ambassador profile details (name, email, country, optional phone); application answers and directory consent; donation records (name, email, amount, currency); volunteer and event registrations; messages sent through contact forms; a session cookie if you sign in; a language cookie; and analytics cookies only if you opt in.

Payment card numbers never touch GLAI servers. The payment processor handles card data. Phone numbers are stored encrypted at the field level.

Retention: ambassador and staff accounts while membership or employment is active, then 24 months after closure unless a longer legal duty applies; donation records 7 years for accounting; event and volunteer registrations 24 months after the event or assignment; contact messages 24 months; session cookies 14 days; language cookie 12 months.

Deletion: use the contact form with the topic “Privacy / deletion”, or email the address on this page. Staff with the Users permission can fulfil a request in the admin panel. We redact personal fields, deactivate the account, and keep only what the law requires (for example donation amounts for accounting).

Safeguarding: content that involves children or vulnerable people is not published until a named safeguarding review is recorded.

Replace this seed with counsel-approved policy before launch if legal review requires different periods.`,
  },
  cookies: {
    title: "Cookie Policy",
    description: "Necessary cookies and optional analytics on the GLAI website.",
    body: `Necessary cookies: glai_session keeps you signed in (14 days); glai_locale remembers the language you chose (12 months); glai_cookie_consent stores your analytics choice (12 months). These are required for the site to work as you asked.

Optional analytics cookies load only after you choose “Accept analytics” on the cookie banner, and only when a measurement ID is configured. You can change your choice by clearing site cookies.

Replace this seed with the approved cookie policy if counsel requires different wording.`,
  },
  accessibility: {
    title: "Accessibility Statement",
    description: "GLAI’s accessibility commitment and how to report a barrier.",
    body: "GLAI aims to meet WCAG 2.1 AA. If you encounter a barrier, write to hello@globalloveambassadors.org. Replace this seed with the approved statement.",
  },
} as const;

export type LegalSlug = keyof typeof legalPages;

export function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}
