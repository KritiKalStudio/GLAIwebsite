import Link from "next/link";
import { DonateForm } from "@/components/forms/donate-form";
import { Kicker, Section } from "@/components/blocks/section";
import { getPublishedCampaigns } from "@/lib/content/donations";
import { getActiveProgramsWithRaised } from "@/lib/content/programs";
import { formatMoney } from "@/lib/format";

export const metadata = {
  title: "Donate",
  description: "Give once or monthly. Program sponsorship and institutional conversations live here too.",
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [campaigns, programs] = await Promise.all([getPublishedCampaigns(), getActiveProgramsWithRaised()]);

  return (
    <>
      <Section className="bg-brand text-paper">
        <Kicker>Give</Kicker>
        <h1 className="mt-3 font-display text-4xl">Support the mission</h1>
        <p className="mt-4 max-w-2xl text-paper/85">
          You do not need an account to give. Payment gateways will connect later; gifts are recorded and receipted.
        </p>
      </Section>
      <Section>
        {error ? (
          <p className="mb-6 text-sm text-danger" role="alert">
            Please enter a valid amount.
          </p>
        ) : null}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,.65fr)] lg:items-start">
          <DonateForm campaigns={campaigns} />
          <aside className="space-y-5 lg:sticky lg:top-32">
            <div className="editorial-card bg-mist p-6">
              <p className="eyebrow">Why recurring gifts matter</p>
              <h2 className="mt-3 font-display text-2xl text-brand">Keep the work moving between the headlines.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Monthly support gives GLAI room to plan, respond, and stay present with communities over time.
              </p>
            </div>
          </aside>
        </div>
        <div id="sponsor" className="mt-16">
          <h2 className="font-display text-3xl">Sponsor a program</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Active campaigns listed by the team. Each bar shows how much has been raised against the goal.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4">
            {programs.map((program) => {
              const goal = Number(program.goalAmount ?? 0) || 0;
              const raised = program.raised;
              const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
              return (
                <li key={program.id} className="editorial-card bg-paper p-5">
                  <p className="text-xs tracking-wide text-accent uppercase">{program.name} fundraiser</p>
                  <h3 className="mt-2 font-display text-2xl text-brand">{program.name}</h3>
                  <p className="mt-2 text-sm text-muted">{program.shortDescription}</p>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-mist">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {formatMoney(raised, program.currency)} raised
                      {goal > 0 ? ` of ${formatMoney(goal, program.currency)}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/our-work/${program.slug}`}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-paper"
                  >
                    Sponsor this program
                  </Link>
                </li>
              );
            })}
            {programs.length === 0 ? (
              <li className="text-sm text-muted">No campaigns are in their active period right now.</li>
            ) : null}
          </ul>
        </div>
      </Section>
    </>
  );
}
