import { CopySection, PageHero } from "@/components/blocks/page-sections";

export const metadata = {
  title: "Love Ambassadors",
  description: "Who can join, what Ambassadors do, and how the pathway works.",
};

export default function LoveAmbassadorsPage() {
  return (
    <>
      <PageHero
        kicker="Love Ambassadors"
        headline="People who live by love and carry the message globally."
        subheadline="Love Ambassadors are not a mailing list. They train, they serve, they are counted in a global network, and they appear in the public directory only with consent."
        primary={{ href: "/signup", label: "Become a member" }}
        secondary={{ href: "/love-ambassadors/network", label: "View the network" }}
      />
      <CopySection heading="Who can become one">
        <p>
          Adults of any faith, ethnicity, or nationality who are willing to live by the Ambassador principles, complete
          training, and be accountable to the code of conduct.
        </p>
      </CopySection>
      <CopySection heading="What Ambassadors do">
        <p>
          They facilitate dialogue, serve in Love in Action, run politically neutral civic education, participate in
          campaigns such as #SpreadTheLove and Global Love Day, and represent the movement with dignity in their own
          communities. They do not campaign for candidates.
        </p>
      </CopySection>
      <CopySection heading="Principles, training, and recognition">
        <p>
          Sign up, confirm your WhatsApp number, and your membership dashboard opens immediately. There is no
          application review in between. From the dashboard you can take volunteer roles, follow active campaigns, and
          see upcoming events.
        </p>
      </CopySection>
    </>
  );
}
