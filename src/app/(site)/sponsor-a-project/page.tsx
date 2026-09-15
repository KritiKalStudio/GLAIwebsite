import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { ButtonLink } from "@/components/ui/button";
import { getSponsorTiers } from "@/lib/content/donations";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Sponsor a Project", description: "Partner with GLAI to sponsor a named program or project." };

export default async function SponsorProjectPage() {
  const tiers = await getSponsorTiers();
  return <>
    <Section className="page-hero-grid bg-brand text-paper">
      <Kicker>Partnerships</Kicker>
      <div className="mt-3 max-w-4xl border-t border-sunshine pt-4 sm:mt-5 sm:pt-6"><h1 className="font-display text-[1.85rem] leading-tight sm:text-5xl lg:text-6xl">Back work your people can see and follow.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/80 sm:mt-6 sm:text-lg">Sponsor a named GLAI program as an institution, community, or individual. We will shape a clear plan around the support you want to give.</p><ButtonLink href="#tiers" variant="sunshine" size="lg" className="mt-5 sm:mt-8">Explore sponsorships</ButtonLink></div>
    </Section>
    <Section id="tiers" className="bg-mist"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><Kicker>Choose a starting point</Kicker><h2 className="mt-2 font-display text-2xl text-brand sm:mt-3 sm:text-4xl">Sponsor a program</h2></div><Link className="text-sm font-semibold text-accent hover:text-brand" href="/donate">Prefer a direct gift? Donate instead →</Link></div><ul className="mt-5 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-3">{tiers.map((tier) => <li key={tier.id} className="flex flex-col rounded-lg border border-brand/10 bg-paper p-4 sm:rounded-[1.1rem] sm:p-6"><p className="eyebrow">{tier.name}</p><p className="mt-2 font-display text-2xl text-brand sm:mt-4 sm:text-3xl">{formatMoney(tier.amount, tier.currency)}</p><p className="mt-2 flex-1 text-sm leading-relaxed text-muted sm:mt-4">{tier.benefits}</p><ButtonLink href={`/get-involved/partner?tier=${encodeURIComponent(tier.name)}`} variant="primary" className="mt-4 sm:mt-7">Start an enquiry</ButtonLink></li>)}</ul></Section>
    <Section><div className="grid gap-6 lg:grid-cols-2 lg:gap-10"><div><Kicker>For organizations</Kicker><h2 className="mt-3 font-display text-2xl text-brand sm:text-4xl">A practical partnership, not a vague promise.</h2><p className="mt-5 max-w-xl leading-relaxed text-muted">GLAI can work with your team on a shared scope, reporting rhythm, and a meaningful way to show what your support has made possible.</p></div><ul className="divide-y divide-brand/10 border-y border-brand/10 text-sm font-medium text-brand"><li className="py-4">Dedicated scope and clear milestones</li><li className="py-4">Progress updates made for your team</li><li className="py-4">A pathway for staff or community participation</li><li className="py-4">Thoughtful acknowledgement where appropriate</li></ul></div></Section>
  </>;
}
