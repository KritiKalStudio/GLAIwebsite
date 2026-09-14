import { cn } from "@/lib/cn";

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("reveal px-4 py-18 lg:px-8 lg:py-28", className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      {children}
    </p>
  );
}

export function AuthPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Section className="py-12 lg:py-20">
      <div className={cn("mx-auto w-full max-w-md", className)}>{children}</div>
    </Section>
  );
}
