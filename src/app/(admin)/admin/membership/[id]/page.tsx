import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { ambassadors } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { decryptField } from "@/lib/crypto";
import { formatDate } from "@/lib/format";
import { tierForCount } from "@/lib/referral-tiers";
import { countSuccessfulReferrals, ensureReferralCode } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export default async function MembershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("membership");
  const { id } = await params;
  const db = getDb();
  const [row] = await db.select().from(ambassadors).where(eq(ambassadors.id, id)).limit(1);
  if (!row) notFound();
  const referralCode = row.userId && row.status === "active" ? (row.referralCode ?? (await ensureReferralCode(row.id))) : row.referralCode;
  const referralCount = await countSuccessfulReferrals(row.id);
  const honour = tierForCount(referralCount);
  const [referrer] = row.referredById
    ? await db
        .select({ fullName: ambassadors.fullName, referralCode: ambassadors.referralCode })
        .from(ambassadors)
        .where(eq(ambassadors.id, row.referredById))
        .limit(1)
    : [];

  const fields: { label: string; value: string }[] = [
    { label: "Email", value: row.email },
    { label: "WhatsApp", value: decryptField(row.whatsapp) ?? decryptField(row.phone) ?? "—" },
    { label: "Age", value: row.age != null ? String(row.age) : "—" },
    { label: "Nationality", value: row.nationality || row.country || "—" },
    { label: "State of origin", value: row.stateOfOrigin || "—" },
    { label: "Geo-political zone", value: row.geoPoliticalZone || "—" },
    { label: "LGA", value: row.localGovernment || "—" },
    { label: "Electoral ward", value: row.electoralWard || "—" },
    { label: "Polling unit", value: row.pollingUnit || "—" },
    { label: "Current address", value: row.currentAddress || "—" },
    { label: "Tribe", value: row.tribe || "—" },
    { label: "Religion", value: row.religion || "—" },
    { label: "Education", value: row.education || "—" },
    { label: "Occupation", value: row.occupation || row.profession || "—" },
    { label: "Organization", value: row.organization || "—" },
    { label: "Directory consent", value: row.consentToDirectory ? "Yes — may appear by name" : "No — counted only" },
    { label: "Referral code", value: referralCode || "—" },
    {
      label: "Referred by",
      value: referrer ? `${referrer.fullName}${referrer.referralCode ? ` (${referrer.referralCode})` : ""}` : "—",
    },
    { label: "Successful referrals", value: String(referralCount) },
    { label: "Referral badge", value: honour?.name ?? "None yet" },
    { label: "Joined", value: formatDate(row.createdAt) },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs tracking-wide text-accent uppercase">{row.status}</p>
        <h1 className="mt-2 font-display text-3xl">{row.fullName}</h1>
      </div>
      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-brand/10 bg-paper p-5 text-sm sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-muted">{field.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
