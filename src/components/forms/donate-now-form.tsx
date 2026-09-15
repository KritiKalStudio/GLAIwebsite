"use client";

import { useState } from "react";
import { createProgramDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/field";

const presets = ["5000", "10000", "25000", "50000"];
const methods = [
  { id: "paystack", label: "Paystack" },
  { id: "stripe", label: "Stripe" },
  { id: "gofundme", label: "GoFundMe" },
  { id: "patreon", label: "Patreon" },
  { id: "bank_transfer", label: "Direct bank transfer" },
] as const;

export function DonateNowForm({
  programSlug,
  member,
  bank,
}: {
  programSlug: string;
  member: { name: string; email: string; phone: string; organization: string } | null;
  bank: { bankName: string; accountName: string; accountNumber: string; instructions?: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("paystack");

  return (
    <div className="mt-8">
      <Button type="button" variant="sunshine" className="w-full sm:w-auto" onClick={() => setOpen((value) => !value)}>
        {open ? "Close donation form" : "Donate now"}
      </Button>
      {open ? (
        <form action={createProgramDonation} className="mt-6 grid gap-4 rounded-lg border border-brand/10 bg-paper p-4 sm:gap-5 sm:rounded-2xl sm:p-6">
          <input type="hidden" name="programSlug" value={programSlug} />
          <fieldset>
            <legend className="text-sm font-semibold">Amount</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((amount) => (
                <label
                  key={amount}
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-brand/20 px-3 py-2 text-sm font-semibold has-checked:border-brand has-checked:bg-brand has-checked:text-paper"
                >
                  <input type="radio" name="amount" value={amount} className="sr-only" defaultChecked={amount === "10000"} />
                  ₦{Number(amount).toLocaleString()}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Or a custom amount" name="customAmount">
              <TextInput id="customAmount" name="customAmount" inputMode="numeric" placeholder="Enter amount" />
            </Field>
            <Field label="Currency" name="currency">
              <Select id="currency" name="currency" defaultValue="NGN">
                <option value="NGN">₦ NGN</option>
                <option value="USD">$ USD</option>
                <option value="GBP">£ GBP</option>
                <option value="EUR">€ EUR</option>
              </Select>
            </Field>
          </div>
          {member ? (
            <>
              <p className="text-sm text-muted">
                You are signed in as <strong className="text-ink">{member.name}</strong>. We will use your membership
                profile unless you donate anonymously.
              </p>
              <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="anonymous" />
                Donate anonymously
              </label>
            </>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name (optional)" name="donorName">
                  <TextInput id="donorName" name="donorName" autoComplete="name" />
                </Field>
                <Field label="Organization (optional)" name="donorOrganization">
                  <TextInput id="donorOrganization" name="donorOrganization" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone (optional)" name="donorPhone">
                  <TextInput id="donorPhone" name="donorPhone" type="tel" />
                </Field>
                <Field label="Email (optional)" name="donorEmail">
                  <TextInput id="donorEmail" name="donorEmail" type="email" />
                </Field>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="anonymous" />
                Donate anonymously
              </label>
            </div>
          )}
          <fieldset>
            <legend className="text-sm font-semibold">Payment method</legend>
            <div className="mt-2 grid gap-2">
              {methods.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-11 cursor-pointer items-center rounded-lg border border-brand/15 px-3 py-3 text-sm font-medium has-checked:border-brand has-checked:bg-mist"
                >
                  <input
                    type="radio"
                    name="processor"
                    value={item.id}
                    className="mr-3"
                    checked={method === item.id}
                    onChange={() => setMethod(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
          {method === "bank_transfer" && bank?.accountNumber ? (
            <div className="rounded-lg bg-mist p-4 text-sm">
              <p className="font-semibold text-brand">Transfer to this account</p>
              <p className="mt-2">{bank.bankName}</p>
              <p>{bank.accountName}</p>
              <p className="font-mono text-base">{bank.accountNumber}</p>
              {bank.instructions ? <p className="mt-2 text-muted">{bank.instructions}</p> : null}
            </div>
          ) : method !== "bank_transfer" ? (
            <p className="text-sm text-muted">
              {methods.find((item) => item.id === method)?.label} will open here when that gateway is connected. Your
              pledge is recorded now.
            </p>
          ) : (
            <p className="text-sm text-muted">A bank account has not been published yet. Choose another method or check back shortly.</p>
          )}
          <Button type="submit" className="w-full sm:w-auto">
            Confirm donation
          </Button>
        </form>
      ) : null}
    </div>
  );
}
