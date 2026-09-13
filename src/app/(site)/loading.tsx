export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="h-3 w-28 rounded-full bg-accent/20" />
      <div className="mt-6 h-12 w-3/4 max-w-xl rounded-lg bg-brand/10" />
      <div className="mt-4 h-4 w-full max-w-2xl rounded bg-brand/5" />
      <div className="mt-2 h-4 w-5/6 max-w-xl rounded bg-brand/5" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-48 rounded-2xl bg-paper shadow-sm ring-1 ring-brand/10" />
        <div className="h-48 rounded-2xl bg-paper shadow-sm ring-1 ring-brand/10" />
        <div className="h-48 rounded-2xl bg-paper shadow-sm ring-1 ring-brand/10" />
      </div>
    </div>
  );
}
