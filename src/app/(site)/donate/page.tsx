import { DonateForm } from "@/components/forms/donate-form";
import { BankDetailsCard } from "@/components/forms/bank-details-card";
import { Kicker, Section } from "@/components/blocks/section";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedCampaigns } from "@/lib/content/donations";
import { getActiveProgramsWithRaised } from "@/lib/content/programs";
import { getSiteSettings } from "@/lib/content/settings";
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
  const [campaigns, programs, settings] = await Promise.all([
    getPublishedCampaigns(),
    getActiveProgramsWithRaised(),
    getSiteSettings(),
  ]);

  return (
    <>
      <Section className="bg-brand text-paper">
        <Kicker>Give</Kicker>
        <h1 className="mt-3 font-display text-2xl sm:text-4xl">Support the mission</h1>
        <p className="mt-3 max-w-2xl text-sm text-paper/85 sm:mt-4 sm:text-base">
          Card and mobile-money gateways are not connected yet. Use the account details below for a bank transfer, or
          record a gift here so we can send a receipt.
        </p>
      </Section>
      <Section>
        {error ? (
          <p className="mb-6 text-sm text-danger" role="alert">
            Please enter a valid amount.
          </p>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,.65fr)] lg:gap-10 lg:items-start">
          <DonateForm campaigns={campaigns} />
          <aside className="space-y-5 lg:sticky lg:top-32">
            <BankDetailsCard bank={settings?.payment?.bank} />
            <div className="editorial-card bg-paper p-4 sm:p-6">
              <p className="eyebrow">Monthly gifts</p>
              <h2 className="mt-3 font-display text-xl text-brand sm:text-2xl">A recorded pledge, not an auto-debit yet.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Choosing monthly saves your intention and gives you a link to pause or cancel it. Until Paystack or
                Stripe is connected, GLAI cannot charge a card each month. Repeat the bank transfer above, or wait for
                gated billing.
              </p>
            </div>
          </aside>
        </div>
        <div id="sponsor" className="mt-10 sm:mt-16">
          <h2 className="font-display text-2xl sm:text-3xl">Sponsor a program</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Active campaigns listed by the team. Each bar shows how much has been raised against the goal.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4">
            {programs.map((program) => {
              const goal = Number(program.goalAmount ?? 0) || 0;
              const raised = program.raised;
              const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
              return (
                <li key={program.id} className="editorial-card bg-paper p-4 sm:p-5">
                  <p className="text-xs tracking-wide text-accent uppercase">{program.name} fundraiser</p>
                  <h3 className="mt-2 font-display text-lg text-brand sm:text-2xl">{program.name}</h3>
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
                  <ButtonLink href={`/our-work/${program.slug}`} className="mt-4" size="sm">
                    Sponsor this program
                  </ButtonLink>
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
