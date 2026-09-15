export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="h-3 w-28 rounded-full bg-accent/20" />
      <div className="mt-4 h-8 w-3/4 max-w-xl rounded-lg bg-brand/10 sm:mt-6 sm:h-12" />
      <div className="mt-3 h-4 w-full max-w-2xl rounded bg-brand/5 sm:mt-4" />
      <div className="mt-2 h-4 w-5/6 max-w-xl rounded bg-brand/5" />
      <div className="mt-6 grid gap-3 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-lg bg-paper shadow-sm ring-1 ring-brand/10 sm:h-48 sm:rounded-2xl" />
        <div className="h-28 rounded-lg bg-paper shadow-sm ring-1 ring-brand/10 sm:h-48 sm:rounded-2xl" />
        <div className="h-28 rounded-lg bg-paper shadow-sm ring-1 ring-brand/10 sm:h-48 sm:rounded-2xl" />
      </div>
    </div>
  );
}
