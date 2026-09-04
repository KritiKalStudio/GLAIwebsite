import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateRecurringDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/blocks/section";
import { getDb } from "@/db";
import { recurringDonations } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage donation", robots: { index: false, follow: false } };

export default async function ManageDonationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [row] = await getDb()
    .select()
    .from(recurringDonations)
    .where(eq(recurringDonations.manageTokenHash, hashToken(token)))
    .limit(1);
  if (!row) notFound();

  return (
    <Section className="max-w-lg">
      <h1 className="font-display text-3xl">Monthly gift</h1>
      <p className="mt-3 text-muted">
        {formatMoney(row.amount, row.currency)} · status: {row.status}
      </p>
      <form action={updateRecurringDonation} className="mt-8 flex flex-wrap gap-2">
        <input type="hidden" name="token" value={token} />
        <Button name="status" value="paused" variant="outline">
          Pause
        </Button>
        <Button name="status" value="active" variant="secondary">
          Resume
        </Button>
        <Button name="status" value="cancelled" variant="danger">
          Cancel
        </Button>
      </form>
    </Section>
  );
}
