import { CopySection, PageHero, PeopleGrid } from "@/components/blocks/page-sections";
import { getPublishedPeople } from "@/lib/content/settings";

export const metadata = {
  title: "About",
  description: "Mission, vision, theory of change, and the institutional story.",
};

export default async function AboutPage() {
  const people = await getPublishedPeople();

  return (
    <>
      <PageHero
        kicker="About"
        headline="A movement people can trust, join, support, and participate in."
        subheadline="GLAI is not only a set of projects. It exists to raise Love Ambassadors, create dialogue, mobilize communities, educate citizens for civic life, run campaigns, and build a lasting global movement."
        primary={{ href: "/transparency", label: "Read the Transparency Center" }}
        secondary={{ href: "/our-work", label: "Our work" }}
      />
      <CopySection heading="Mission">
        <p>
          To restore love in a divided world by forming people and communities who choose humanity above differences —
          in public, not only in private — and who can take part in civic life without being captured by party,
          patronage, or empty promises.
        </p>
      </CopySection>
      <CopySection heading="Vision">
        <p>
          A world in which love, unity, peaceful coexistence, and collective progress are practiced as ordinary civic
          life, and every citizen can understand politics, know their rights, and choose leaders in the public interest.
        </p>
      </CopySection>
      <CopySection heading="Theory of change">
        <p>
          If we train Love Ambassadors, convene honest dialogue, educate citizens for nonpartisan civic judgement, and
          make love visible through action and campaign, then communities can interrupt cycles of distrust, corruption,
          and political marginalization — and institutions can fund and verify that work. Training changes people.
          Dialogue changes rooms. Civic education changes who gets believed. Action changes conditions. Transparency
          keeps the whole of it accountable.
        </p>
      </CopySection>
      <CopySection heading="Nonpartisan civic work">
        <p>
          GLAI works against political marginalization, corruption, unhealthy nepotism, and fake campaign promises. We
          do that through political sensitization, politically neutral campaigns, and education about rights and the
          factors that identify a candidate whose interest is the public’s — not a party’s, and not ours.
        </p>
        <p>
          This is not candidate projection. GLAI does not endorse, fund, or campaign for any person or party in any
          election. We help citizens recognize fraudulent or incompetent leadership, recognize qualified leadership,
          and then make their own informed decisions.
        </p>
      </CopySection>
      <PeopleGrid
        intro="The people who govern and run GLAI. Profiles are published from the admin Leadership page."
        people={people}
      />
    </>
  );
}
