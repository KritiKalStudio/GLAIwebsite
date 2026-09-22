export function DashboardHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-5">
      <h1 className="font-display text-2xl text-brand sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
    </header>
  );
}

export function DashboardNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 rounded-lg bg-hope/20 px-3 py-2.5 text-sm font-medium text-ink" role="status">
      {children}
    </p>
  );
}
