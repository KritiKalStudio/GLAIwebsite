import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/blocks/section";
import { getDb } from "@/db";
import { donations } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Donation receipt", robots: { index: false, follow: false } };

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ manage?: string }>;
}) {
  const { ref } = await params;
  const { manage } = await searchParams;
  const [donation] = await getDb()
    .select()
    .from(donations)
    .where(eq(donations.processorRef, ref))
    .limit(1);
  if (!donation) notFound();

  return (
    <Section className="max-w-xl">
      <p className="text-xs tracking-wide text-accent uppercase">Receipt</p>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl">Thank you</h1>
      <dl className="mt-5 space-y-3 rounded-lg border border-brand/10 bg-paper p-4 text-sm sm:mt-8 sm:p-6">
        <div className="flex justify-between">
          <dt>Receipt</dt>
          <dd>{donation.processorRef}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Amount</dt>
          <dd>{formatMoney(donation.amount, donation.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Frequency</dt>
          <dd>{donation.frequency.replace("_", " ")}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Date</dt>
          <dd>{formatDate(donation.createdAt)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Processor</dt>
          <dd>{donation.processor}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted">Print this page or save it as a PDF from your browser.</p>
      {manage && /^[a-f0-9]{48}$/i.test(manage) ? (
        <ButtonLink href={`/donate/manage/${manage}`} className="mt-6" variant="outline">
          Manage monthly gift
        </ButtonLink>
      ) : null}
    </Section>
  );
}
