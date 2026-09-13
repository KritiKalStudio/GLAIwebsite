import { CopySection, PageHero } from "@/components/blocks/page-sections";

export const metadata = {
  title: "Careers",
  description: "Roles, fellowships, and how to work with GLAI.",
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        kicker="Careers"
        headline="Work that asks for courage and care."
        subheadline="Open roles will be listed here. Until a vacancy is published, the best pathways in are Love Ambassador training and volunteering."
        primary={{ href: "/love-ambassadors", label: "Become an Ambassador" }}
        secondary={{ href: "/get-involved/volunteer", label: "Volunteer" }}
      />
      <CopySection heading="No open vacancies yet">
        <p>
          When GLAI publishes a vacancy, fellowship, or consultancy, it will be listed on this page. Until then, join
          through Love Ambassador training or an open volunteer role.
        </p>
      </CopySection>
    </>
  );
}
