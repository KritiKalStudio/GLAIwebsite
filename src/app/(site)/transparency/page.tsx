import { CopySection, PageHero } from "@/components/blocks/page-sections";

export const metadata = {
  title: "Transparency",
  description: "Registration, governance, reports, and policies as GLAI supplies them.",
};

export default function TransparencyPage() {
  return (
    <>
      <PageHero
        kicker="Accountability"
        headline="A public record of how this work is held."
        subheadline="Registration, governance, reports, and policies belong here as GLAI supplies the documents. Until then these are placeholders, not invented claims."
      />
      <CopySection heading="What this center will hold">
        <p>
          CAC registration, governance, board and executive profiles, annual and financial reports, safeguarding, code of
          conduct, procurement, conflict-of-interest, and partnership records. Seed pages are placeholders until GLAI
          supplies the documents.
        </p>
      </CopySection>
    </>
  );
}
