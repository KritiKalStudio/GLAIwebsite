export function BankDetailsCard({
  bank,
}: {
  bank?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    instructions?: string;
  } | null;
}) {
  if (!bank?.accountNumber && !bank?.bankName && !bank?.accountName) {
    return (
      <div className="editorial-card bg-mist p-6">
        <p className="eyebrow">Bank transfer</p>
        <h2 className="mt-3 font-display text-2xl text-brand">Account details coming soon</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          An administrator can publish the organisation account name, number, and bank from the dashboard Settings page.
        </p>
      </div>
    );
  }

  return (
    <div className="editorial-card bg-mist p-6">
      <p className="eyebrow">Bank transfer</p>
      <h2 className="mt-3 font-display text-2xl text-brand">Give directly to this account</h2>
      <dl className="mt-5 space-y-3 text-sm">
        {bank.bankName ? (
          <div>
            <dt className="text-xs tracking-wide text-muted uppercase">Bank</dt>
            <dd className="mt-1 font-semibold text-ink">{bank.bankName}</dd>
          </div>
        ) : null}
        {bank.accountName ? (
          <div>
            <dt className="text-xs tracking-wide text-muted uppercase">Account name</dt>
            <dd className="mt-1 font-semibold text-ink">{bank.accountName}</dd>
          </div>
        ) : null}
        {bank.accountNumber ? (
          <div>
            <dt className="text-xs tracking-wide text-muted uppercase">Account number</dt>
            <dd className="mt-1 font-mono text-lg font-semibold tracking-wide text-ink">{bank.accountNumber}</dd>
          </div>
        ) : null}
      </dl>
      {bank.instructions ? <p className="mt-4 text-sm leading-relaxed text-muted">{bank.instructions}</p> : null}
    </div>
  );
}
