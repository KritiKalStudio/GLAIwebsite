import { FaqList, PageHero } from "@/components/blocks/page-sections";
import { getPublishedFaqs } from "@/lib/content/settings";

export const metadata = {
  title: "FAQ",
  description: "Straight answers for ambassadors, donors, partners, and the press.",
};

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();

  return (
    <>
      <PageHero
        kicker="FAQ"
        headline="Questions we are asked, answered in public."
        subheadline="Answers are published from the admin dashboard so they can be updated without changing the page layout."
      />
      <FaqList faqs={faqs} />
    </>
  );
}
