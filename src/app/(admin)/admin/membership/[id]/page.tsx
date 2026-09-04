import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { approveAmbassador, issueCertificate, rejectAmbassador } from "@/app/actions/ambassadors";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { getDb } from "@/db";
import { ambassadors, certificates } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { decryptField } from "@/lib/crypto";
import { formatDate } from "@/lib/format";

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
  const certs = await db
    .select()
    .from(certificates)
    .where(eq(certificates.ambassadorId, id))
    .orderBy(desc(certificates.issuedAt));

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs tracking-wide text-accent uppercase">{row.status}</p>
        <h1 className="mt-2 font-display text-3xl">{row.fullName}</h1>
        <p className="mt-2 text-muted">
          {row.email}
          {row.phone ? ` · ${decryptField(row.phone) ?? "stored encrypted"}` : ""}
        </p>
      </div>
      <dl className="grid gap-4 rounded-lg border border-brand/10 bg-paper p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Country</dt>
          <dd>{row.country}</dd>
        </div>
        <div>
          <dt className="text-muted">Region</dt>
          <dd>{row.region || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Profession</dt>
          <dd>{row.profession || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Applied</dt>
          <dd>{formatDate(row.createdAt)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Why they want to join</dt>
          <dd className="mt-1 whitespace-pre-wrap">{row.whyJoin}</dd>
        </div>
        <div>
          <dt className="text-muted">Areas of interest</dt>
          <dd>{row.areasOfInterest.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Directory consent</dt>
          <dd>{row.consentToDirectory ? "Yes — may appear by name" : "No — counted only"}</dd>
        </div>
      </dl>

      {row.status === "applied" ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <form action={approveAmbassador} className="rounded-lg border border-hope/40 bg-paper p-5">
            <input type="hidden" name="id" value={row.id} />
            <h2 className="font-display text-xl">Approve</h2>
            <p className="mt-2 text-sm text-muted">
              Creates a member account and emails a password-reset link so they can sign in.
            </p>
            <div className="mt-4">
              <ConfirmSubmit message="Approve this application and create a member account?" variant="primary">
                Approve application
              </ConfirmSubmit>
            </div>
          </form>
          <form action={rejectAmbassador} className="rounded-lg border border-brand/10 bg-paper p-5">
            <input type="hidden" name="id" value={row.id} />
            <h2 className="font-display text-xl">Decline</h2>
            <Field label="Notes (internal)" name="reviewNotes">
              <TextArea id="reviewNotes" name="reviewNotes" />
            </Field>
            <div className="mt-4">
              <ConfirmSubmit message="Decline this application? This cannot be undone from this screen.">
                Decline application
              </ConfirmSubmit>
            </div>
          </form>
        </div>
      ) : null}

      {row.status === "active" || row.status === "approved" ? (
        <section className="rounded-lg border border-brand/10 bg-paper p-5">
          <h2 className="font-display text-xl">Certificates</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {certs.map((cert) => (
              <li key={cert.id}>
                {cert.title} · {formatDate(cert.issuedAt)}
              </li>
            ))}
            {certs.length === 0 ? <li className="text-muted">None issued yet.</li> : null}
          </ul>
          <form action={issueCertificate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="ambassadorId" value={row.id} />
            <Field label="Certificate title" name="title">
              <TextInput
                id="title"
                name="title"
                defaultValue="Love Ambassador — Foundations"
              />
            </Field>
            <div className="self-end">
              <Button type="submit" size="sm">
                Issue certificate
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
