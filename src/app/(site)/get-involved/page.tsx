import { CtaBanner, PageHero } from "@/components/blocks/page-sections";

export const metadata = {
  title: "Get Involved",
  description: "Volunteer, partner, or sponsor a named program.",
};

export default function GetInvolvedPage() {
  return (
    <>
      <PageHero
        kicker="Participate"
        headline="There is more than one way to stand with this work."
        subheadline="Give time as a volunteer, build an institutional partnership, or underwrite a named program."
        primary={{ href: "/get-involved/volunteer", label: "Volunteer" }}
        secondary={{ href: "/get-involved/partner", label: "Partner with GLAI" }}
      />
      <CtaBanner
        heading="Choose a pathway"
        items={[
          {
            title: "Volunteer",
            href: "/get-involved/volunteer",
            body: "Steward dialogues, civic education sessions, field documentation, and Love in Action.",
          },
          {
            title: "Partner",
            href: "/get-involved/partner",
            body: "Institutions, campuses, and faith communities can host and co-design.",
          },
          {
            title: "Sponsor a program",
            href: "/donate#sponsor",
            body: "Underwrite training, dialogue, civic education, or humanitarian action.",
          },
        ]}
      />
    </>
  );
}
