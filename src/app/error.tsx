"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24">
      <p className="text-xs font-semibold tracking-[0.2em] text-danger uppercase">500</p>
      <h1 className="mt-3 font-display text-4xl">Something went wrong on our side.</h1>
      <p className="mt-4 text-muted">
        Try again. If it keeps happening, write to hello@globalloveambassadors.org.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Home
        </ButtonLink>
      </div>
    </section>
  );
}
