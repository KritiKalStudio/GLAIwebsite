import { desc } from "drizzle-orm";
import { saveCampaign } from "@/app/actions/admin";
import { AdminTable } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { campaigns, donations } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Donations" };

export default async function AdminDonationsPage() {
  await requireAdmin("donations");
  const db = getDb();
  const [campaignRows, giftRows] = await Promise.all([
    db.select().from(campaigns).orderBy(desc(campaigns.updatedAt)),
    db.select().from(donations).orderBy(desc(donations.createdAt)).limit(100),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">Donations</h1>
        <p className="mt-2 text-sm text-muted">
          Campaigns appear on the public donate page. Gifts below are recorded from the sandbox or live processor.
        </p>
      </div>
      <section>
        <h2 className="font-display text-xl">Campaigns</h2>
        <div className="mt-3">
          <AdminTable headers={["Name", "Address", "Currency", "Status"]}>
            {campaignRows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-muted">{row.slug}</td>
                <td className="px-4 py-3">{row.currency}</td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
        <form action={saveCampaign} className="mt-6 grid max-w-xl gap-4 rounded-lg border border-brand/10 bg-paper p-5">
          <h3 className="font-display text-lg">Add a campaign</h3>
          <Field label="Name" name="name">
            <TextInput id="name" name="name" required />
          </Field>
          <Field label="Web address" name="slug">
            <TextInput id="slug" name="slug" required />
          </Field>
          <Field label="Description" name="description">
            <TextArea id="description" name="description" required />
          </Field>
          <Field label="Currency" name="currency">
            <TextInput id="currency" name="currency" defaultValue="NGN" />
          </Field>
          <Field label="Status" name="status">
            <Select id="status" name="status" defaultValue="published">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <Button type="submit">Save campaign</Button>
        </form>
      </section>
      <section>
        <h2 className="font-display text-xl">Recent gifts</h2>
        <div className="mt-3">
          <AdminTable headers={["Donor", "Amount", "Frequency", "Status", "When"]}>
            {giftRows.map((gift) => (
              <tr key={gift.id}>
                <td className="px-4 py-3">
                  {gift.isAnonymous === "true" ? "Anonymous" : gift.donorName}
                  <span className="block text-xs text-muted">{gift.donorEmail}</span>
                </td>
                <td className="px-4 py-3">{formatMoney(gift.amount, gift.currency)}</td>
                <td className="px-4 py-3">{gift.frequency.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">{gift.status}</td>
                <td className="px-4 py-3">{formatDate(gift.createdAt, "d MMM yyyy")}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </section>
    </div>
  );
}
