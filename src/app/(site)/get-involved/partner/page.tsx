import { CopySection, PageHero } from "@/components/blocks/page-sections";

export const metadata = {
  title: "Partner",
  description: "Institutional collaboration with campuses, communities, and funders.",
};

export default function PartnerPage() {
  return (
    <>
      <PageHero
        kicker="Partnerships"
        headline="Build the work with us, not only around us."
        subheadline="GLAI partners with institutions that can host dialogues, co-deliver training, host nonpartisan civic education, or fund a named program. Conversations are handled separately from individual giving."
        primary={{ href: "/contact", label: "Start a conversation" }}
        secondary={{ href: "/donate#sponsor", label: "Sponsor a program" }}
      />
      <CopySection heading="What partnership looks like">
        <p>
          A partnership is a written understanding: who hosts, who facilitates, how safeguarding is held, and how
          outcomes are reported in the Impact Portfolio. Civic education partnerships stay nonpartisan — no candidate
          materials, no party briefing. Use the contact form with the topic “Partnership” to begin.
        </p>
      </CopySection>
    </>
  );
}
