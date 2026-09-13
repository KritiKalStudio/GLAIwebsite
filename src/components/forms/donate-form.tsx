"use client";

import { createSandboxDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/field";

const presets = ["5000", "10000", "25000", "50000"];

export function DonateForm({
  campaigns,
}: {
  campaigns: { slug: string; name: string }[];
}) {
  return (
    <form action={createSandboxDonation} className="editorial-card grid max-w-xl gap-7 bg-paper p-4 sm:p-7">
      <fieldset>
        <legend className="eyebrow">Step 1 · Giving frequency</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-paper"><input type="radio" name="frequency" value="one_time" className="sr-only" defaultChecked />One-time</label>
          <label className="cursor-pointer rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-paper"><input type="radio" name="frequency" value="monthly" className="sr-only" />Monthly</label>
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow">Step 2 · Amount</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((amount) => (
            <label key={amount} className="cursor-pointer rounded-full border border-brand/20 px-4 py-2 text-sm font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-paper">
              <input type="radio" name="amount" value={amount} className="sr-only" defaultChecked={amount === "10000"} />
              ₦{Number(amount).toLocaleString()}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Or a custom amount" name="customAmount"><TextInput id="customAmount" name="customAmount" inputMode="numeric" placeholder="Enter amount" /></Field>
        <Field label="Currency" name="currency"><Select id="currency" name="currency" defaultValue="NGN"><option value="NGN">₦ NGN</option><option value="USD">$ USD</option><option value="GBP">£ GBP</option><option value="EUR">€ EUR</option></Select></Field>
      </div>
      <Field label="Direct my gift to" name="campaignSlug">
        <Select id="campaignSlug" name="campaignSlug" defaultValue="general-fund">
          {campaigns.map((campaign) => <option key={campaign.slug} value={campaign.slug}>{campaign.name}</option>)}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name (optional)" name="donorName"><TextInput id="donorName" name="donorName" /></Field>
        <Field label="Email (optional)" name="donorEmail"><TextInput id="donorEmail" name="donorEmail" type="email" /></Field>
      </div>
      <Field label="Phone" name="donorPhone"><TextInput id="donorPhone" name="donorPhone" /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="anonymous" />
        List this gift as anonymous
      </label>
      <Button type="submit">Complete sandbox gift · Get receipt</Button>
      <p className="text-xs leading-relaxed text-muted">Your details are used only to process the gift and issue a receipt. Payment card data is never stored by GLAI.</p>
    </form>
  );
}
