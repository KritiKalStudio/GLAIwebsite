import Link from "next/link";
import { Kicker, Section } from "@/components/blocks/section";
import { ButtonLink } from "@/components/ui/button";
import { getSponsorTiers } from "@/lib/content/donations";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sponsor a Project", description: "Partner with GLAI to sponsor a named program or project." };

export default async function SponsorProjectPage() {
  const tiers = await getSponsorTiers();
  return <>
    <Section className="page-hero-grid bg-brand text-paper">
      <Kicker>Partnerships</Kicker>
      <div className="mt-5 max-w-4xl border-t border-sunshine pt-6"><h1 className="font-display text-5xl leading-tight sm:text-6xl">Back work your people can see and follow.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">Sponsor a named GLAI program as an institution, community, or individual. We will shape a clear plan around the support you want to give.</p><ButtonLink href="#tiers" variant="sunshine" size="lg" className="mt-8">Explore sponsorships</ButtonLink></div>
    </Section>
    <Section id="tiers" className="bg-mist"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Kicker>Choose a starting point</Kicker><h2 className="mt-3 font-display text-4xl text-brand">Sponsor a program</h2></div><Link className="text-sm font-semibold text-accent hover:text-brand" href="/donate">Prefer a direct gift? Donate instead →</Link></div><ul className="mt-10 grid gap-5 md:grid-cols-3">{tiers.map((tier) => <li key={tier.id} className="editorial-card flex flex-col bg-paper p-6"><p className="eyebrow">{tier.name}</p><p className="mt-4 font-display text-3xl text-brand">{formatMoney(tier.amount, tier.currency)}</p><p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{tier.benefits}</p><ButtonLink href={`/get-involved/partner?tier=${encodeURIComponent(tier.name)}`} variant="primary" className="mt-7">Start an enquiry</ButtonLink></li>)}</ul></Section>
    <Section><div className="grid gap-10 lg:grid-cols-2"><div><Kicker>For organizations</Kicker><h2 className="mt-3 font-display text-4xl text-brand">A practical partnership, not a vague promise.</h2><p className="mt-5 max-w-xl leading-relaxed text-muted">GLAI can work with your team on a shared scope, reporting rhythm, and a meaningful way to show what your support has made possible.</p></div><ul className="divide-y divide-brand/10 border-y border-brand/10 text-sm font-medium text-brand"><li className="py-4">Dedicated scope and clear milestones</li><li className="py-4">Progress updates made for your team</li><li className="py-4">A pathway for staff or community participation</li><li className="py-4">Thoughtful acknowledgement where appropriate</li></ul></div></Section>
  </>;
}
