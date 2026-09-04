import { DonateForm } from "@/components/forms/donate-form";
import { Kicker, Section } from "@/components/blocks/section";
import { getPublishedCampaigns, getSponsorTiers } from "@/lib/content/donations";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
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
  const [campaigns, tiers] = await Promise.all([
    getPublishedCampaigns(),
    getSponsorTiers(),
  ]);

  return (
    <>
      <Section className="bg-brand text-paper">
        <Kicker>Give</Kicker>
        <h1 className="mt-3 font-display text-4xl">Support the mission</h1>
        <p className="mt-4 max-w-2xl text-paper/85">
          Payment cards never touch GLAI servers. Until a live gateway is configured, gifts complete in sandbox mode and still generate a receipt.
        </p>
      </Section>
      <Section>
        {error ? (
          <p className="mb-6 text-sm text-danger" role="alert">
            Please enter a valid amount and your details.
          </p>
        ) : null}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,.65fr)] lg:items-start">
          <DonateForm campaigns={campaigns} />
          <aside className="space-y-5 lg:sticky lg:top-32">
            <div className="editorial-card bg-mist p-6"><p className="eyebrow">Why recurring gifts matter</p><h2 className="mt-3 font-display text-2xl text-brand">Keep the work moving between the headlines.</h2><p className="mt-3 text-sm leading-relaxed text-muted">Monthly support gives GLAI room to plan, respond, and stay present with communities over time.</p></div>
            <div className="border-l-2 border-sunshine pl-4"><p className="text-sm font-semibold text-brand">Secure giving</p><p className="mt-1 text-sm leading-relaxed text-muted">A receipt is generated for each completed gift, including sandbox gifts while a live gateway is being configured.</p></div>
          </aside>
        </div>
        <div id="sponsor" className="mt-16">
          <h2 className="font-display text-3xl">Sponsor a program</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Named campaigns let an institution underwrite training or Love in Action rather than unrestricted giving.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => (
              <li key={tier.id} className="editorial-card bg-paper p-5 transition hover:-translate-y-1">
                <p className="text-xs tracking-wide text-accent uppercase">{tier.name}</p>
                <p className="mt-2 font-display text-2xl">{formatMoney(tier.amount, tier.currency)}</p>
                <p className="mt-2 text-sm text-muted">{tier.benefits}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
