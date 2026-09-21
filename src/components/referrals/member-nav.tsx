import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "My space", key: "home" },
  { href: "/dashboard/leaderboard", label: "Leaderboard", key: "leaderboard" },
] as const;

export function MemberDashboardNav({ current }: { current: "home" | "leaderboard" }) {
  return (
    <nav aria-label="Member dashboard" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active = link.key === current;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold",
              active ? "bg-brand text-paper" : "bg-paper text-brand ring-1 ring-brand/15",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
