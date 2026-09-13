import { CopySection, PageHero } from "@/components/blocks/page-sections";

export const metadata = {
  title: "Resources",
  description: "Reports, policies, and a media kit as documents are supplied.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        kicker="Resources"
        headline="Documents the public and the press can actually use."
        subheadline="Reports, policies, and a media kit will live here as GLAI supplies them. Until then, the Transparency Center holds the institutional placeholders."
        primary={{ href: "/transparency", label: "Transparency Center" }}
      />
      <CopySection heading="Media kit">
        <p>
          Logo files, brand colours, and approved photographs will be published here. Journalists can write to
          press@globalloveambassadors.org in the meantime.
        </p>
      </CopySection>
    </>
  );
}
