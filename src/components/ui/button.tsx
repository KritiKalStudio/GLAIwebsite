"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-brand text-paper hover:bg-brand/90 focus-visible:outline-accent",
  secondary:
    "bg-accent text-paper hover:bg-accent/90 focus-visible:outline-brand",
  outline:
    "border border-brand/20 bg-paper text-brand hover:border-brand hover:bg-mist",
  ghost: "text-brand hover:bg-mist shadow-none",
  sunshine: "bg-sunshine text-ink hover:bg-sunshine/90",
  danger: "bg-danger text-paper hover:bg-danger/90",
} as const;

const sizes = {
  sm: "min-h-9 px-3 py-1.5 text-xs sm:text-sm",
  md: "min-h-10 px-4 py-2 text-sm sm:min-h-11 sm:px-5 sm:py-2.5",
  lg: "min-h-10 px-4 py-2 text-sm sm:min-h-12 sm:px-6 sm:py-3 sm:text-base",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

type Common = {
  className?: string;
  variant?: Variant;
  size?: Size;
  flat?: boolean;
  pending?: boolean;
  children: React.ReactNode;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
  flat = false,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
  flat?: boolean;
}) {
  return cn(
    "btn inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight select-none",
    variants[variant],
    sizes[size],
    flat && "btn-flat",
    className,
  );
}

function Spinner({ active }: { active: boolean }) {
  if (!active) return null;
  return <span className="btn-spinner" aria-hidden />;
}

function LinkSpinner() {
  const { pending } = useLinkStatus();
  return <Spinner active={pending} />;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  flat = false,
  pending,
  type = "button",
  disabled,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending: formPending } = useFormStatus();
  const busy = Boolean(pending) || (type === "submit" && formPending);
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      data-flat={flat ? "" : undefined}
      className={buttonClassName({ variant, size, className, flat })}
      {...props}
    >
      <Spinner active={busy && !flat} />
      <span className="btn-label">{children}</span>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  flat = false,
}: Common & { href: string }) {
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      className={buttonClassName({ variant, size, className, flat })}
      data-flat={flat ? "" : undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {external || flat ? null : <LinkSpinner />}
      <span className="btn-label">{children}</span>
    </Link>
  );
}
