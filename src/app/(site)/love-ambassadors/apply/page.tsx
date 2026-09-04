import { ApplyForm } from "@/components/forms/apply-form";
import { Kicker, Section } from "@/components/blocks/section";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply to become a Love Ambassador",
  description: "Submit an application to join the Love Ambassador pathway.",
};

export default function ApplyPage() {
  return (
    <>
      <Section className="bg-brand text-paper">
        <Kicker>Application</Kicker>
        <h1 className="mt-3 max-w-3xl font-display text-4xl">
          Apply to become a Love Ambassador
        </h1>
        <p className="mt-4 max-w-2xl text-paper/85">
          Applications are reviewed by the membership team. Approval provisions a member account; it is not automatic.
        </p>
      </Section>
      <Section>
        <ApplyForm />
      </Section>
    </>
  );
}
