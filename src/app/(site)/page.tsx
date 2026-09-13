import {
  CopySection,
  CtaBanner,
  DonateCta,
  PageHero,
  ProblemSection,
  ProgramCards,
  StatStrip,
  StoryCards,
} from "@/components/blocks/page-sections";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedPrograms } from "@/lib/content/programs";
import { getPublicImpactStats } from "@/lib/content/settings";
import { getPublishedStories } from "@/lib/content/stories";

export const metadata = {
  title: "Global Love Ambassadors Initiative",
  description: "Humanity Above Differences — restoring love in a divided world.",
};

const HOME_HERO_IMAGE =
  "https://pub-2523b5c66e3a4c9a8910900e1f632c44.r2.dev/library/1789306109983-hero_4.jpg";

export default async function HomePage() {
  const [programs, stats, stories] = await Promise.all([
    getPublishedPrograms(),
    getPublicImpactStats(),
    getPublishedStories("stories_of_change"),
  ]);

  return (
    <>
      <PageHero
        kicker="Global Love Ambassadors Initiative"
        headline="Humanity Above Differences — Restoring love in a divided world."
        subheadline="We are building a global movement of people committed to love, unity, peaceful coexistence, and collective progress — including the civic courage to refuse corruption, patronage, and empty promises."
        primary={{ href: "/love-ambassadors", label: "Become a Love Ambassador" }}
        secondary={{ href: "/donate", label: "Support Our Mission" }}
        imageUrl={HOME_HERO_IMAGE}
      />
      <ProblemSection
        heading="The fractures we refuse to accept"
        intro="GLAI exists because division is being practiced in public — and love is not. These are the conditions the movement is built to confront."
        items={[
          { title: "Religious division", body: "Communities taught to fear the faith of their neighbours." },
          { title: "Tribal and ethnic conflict", body: "Identity used as a weapon instead of a heritage." },
          { title: "Political polarization", body: "Public life reduced to camps that cannot share a table." },
          { title: "Hate speech", body: "Language that prepares the ground for violence." },
          { title: "Corruption and nepotism", body: "Public office treated as private property, and loyalty rewarded over competence." },
          { title: "Political marginalization", body: "Citizens locked out of voice, rights, and the chance to judge a record for themselves." },
        ]}
      />
      <CopySection heading="Civic education, without a party line">
        <p>
          GLAI is a humanitarian initiative. It is also civic work. We run politically neutral sensitizations so
          citizens know their rights, can spot fraudulent or incompetent leadership, and can recognize the people
          whose record serves the public — then decide for themselves.
        </p>
        <p>
          We do not project, fund, or campaign for any candidate or party. Empty promises are a public harm. An
          informed citizen is the remedy, not a GLAI-endorsed list.
        </p>
        <p>
          <ButtonLink href="/our-work/civic-education">Read the Civic Education program</ButtonLink>
        </p>
      </CopySection>
      <ProgramCards heading="What we do" programs={programs} />
      <StatStrip
        heading="Our impact"
        note="Figures appear only when GLAI has verified them. Until then the dashboard shows pending values, not invented ones."
        stats={stats}
      />
      <StoryCards heading="Stories of change" stories={stories.slice(0, 3)} />
      <CtaBanner
        heading="Become part of the movement"
        items={[
          { title: "Become an Ambassador", href: "/love-ambassadors", body: "Train, serve, and join a global network." },
          { title: "Volunteer", href: "/get-involved/volunteer", body: "Give time to dialogues, actions, and documentation." },
          { title: "Partner", href: "/get-involved/partner", body: "Build institutional work with GLAI." },
        ]}
      />
      <DonateCta body="Give once or monthly. Every gift is receipted. Recurring gifts can be paused or cancelled without calling an office." />
    </>
  );
}
