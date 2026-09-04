import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/blocks/section";

export default function NotFound() {
  return (
    <Section className="py-24">
      <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl">This page is not here.</h1>
      <p className="mt-4 max-w-lg text-muted">
        The address may have changed, or the page has not been published yet. Return home, or write to us if you expected something to be here.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Contact
        </ButtonLink>
      </div>
    </Section>
  );
}
