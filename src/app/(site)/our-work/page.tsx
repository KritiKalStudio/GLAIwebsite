import { PageHero, ProgramCards } from "@/components/blocks/page-sections";
import { getPublishedPrograms } from "@/lib/content/programs";

export const metadata = {
  title: "Our Work",
  description: "Programs that turn love from a private feeling into public practice — including nonpartisan civic education.",
};

export default async function OurWorkPage() {
  const programs = await getPublishedPrograms();

  return (
    <>
      <PageHero
        kicker="Programs"
        headline="What we do, in public."
        subheadline="Training, dialogue, humanitarian action, civic education, cultural campaign, and a shared global day — each program is a doorway into the movement."
        primary={{ href: "/signup", label: "Become a member" }}
        secondary={{ href: "/donate", label: "Support a program" }}
      />
      <ProgramCards heading="Programs" programs={programs} />
    </>
  );
}
