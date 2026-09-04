import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  ambassadors,
  contactMessages,
  donations,
  events,
  volunteerApplications,
} from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin home" };

export default async function AdminHomePage() {
  await requireAdmin();
  const db = getDb();
  const [pendingApps, unread, upcoming, recentGifts, pendingVolunteers] = await Promise.all([
    db.select().from(ambassadors).where(eq(ambassadors.status, "applied")),
    db.select().from(contactMessages).where(eq(contactMessages.status, "unread")),
    db.select().from(events).where(eq(events.status, "published")).orderBy(events.startsAt).limit(5),
    db.select().from(donations).orderBy(desc(donations.createdAt)).limit(5),
    db.select().from(volunteerApplications).where(eq(volunteerApplications.status, "applied")),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">What needs attention</h1>
        <p className="mt-2 text-sm text-muted">
          Task-based home for staff. Nothing here is technical database language.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat href="/admin/membership" label="Applications to review" value={pendingApps.length} />
        <Stat href="/admin/messages" label="Unread messages" value={unread.length} />
        <Stat href="/admin/volunteers" label="Volunteer applications" value={pendingVolunteers.length} />
        <Stat href="/admin/events" label="Published events" value={upcoming.length} />
      </div>
      <section>
        <h2 className="font-display text-xl">Recent gifts</h2>
        <ul className="mt-3 divide-y divide-brand/10 rounded-lg border border-brand/10 bg-paper">
          {recentGifts.map((gift) => (
            <li key={gift.id} className="flex justify-between px-4 py-3 text-sm">
              <span>{gift.isAnonymous === "true" ? "Anonymous" : gift.donorName}</span>
              <span>
                {formatMoney(gift.amount, gift.currency)} · {formatDate(gift.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-lg border border-brand/10 bg-paper p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-brand">{value}</p>
    </Link>
  );
}
