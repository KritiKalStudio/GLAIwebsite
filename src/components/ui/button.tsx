import Link from "next/link";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-brand text-paper hover:bg-brand/90 focus-visible:outline-accent",
  secondary:
    "bg-accent text-paper hover:bg-accent/90 focus-visible:outline-brand",
  outline:
    "border border-brand/20 bg-paper text-brand hover:border-brand hover:bg-mist",
  ghost: "text-brand hover:bg-mist",
  sunshine: "bg-sunshine text-ink hover:bg-sunshine/90",
  danger: "bg-danger text-paper hover:bg-danger/90",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

type Common = {
  className?: string;
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClassName({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: Common & { href: string }) {
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      className={buttonClassName({ variant, size, className })}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </Link>
  );
}
