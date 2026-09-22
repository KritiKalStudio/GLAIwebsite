"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LayoutDashboard, Settings, Share2, Trophy, Users } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/referrals", label: "Referrals", icon: Share2 },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/profile", label: "Profile", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ── Mobile bottom-dock nav links ───────────────────────────────── */
function MobileNavLinks({ pathname }: { pathname: string }) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const item = activeRef.current;
    const scroller = item?.parentElement;
    if (!item || !scroller) return;
    const left = item.offsetLeft - scroller.clientWidth / 2 + item.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, left) });
  }, [pathname]);

  return (
    <>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            ref={active ? activeRef : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active
                ? "bg-brand text-paper"
                : "text-brand/70",
            )}
          >
            <Icon size={18} aria-hidden className={active ? "text-paper" : "text-accent"} />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

/* ── Desktop sidebar nav links ──────────────────────────────────── */
function SidebarNavLinks({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? link.label : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2",
              active
                ? "bg-brand text-paper"
                : "text-ink/80 hover:bg-mist",
            )}
          >
            <Icon size={16} aria-hidden className={active ? "text-paper" : "text-accent"} />
            {!collapsed && <span>{link.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

export function MemberShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  /* Persist collapse preference */
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="bg-canvas">
      <div
        className={cn(
          "mx-auto w-full max-w-7xl lg:grid lg:items-start lg:gap-8 lg:px-8 lg:py-8 transition-[grid-template-columns] duration-300",
          collapsed
            ? "lg:grid-cols-[4rem_minmax(0,1fr)]"
            : "lg:grid-cols-[16rem_minmax(0,1fr)]",
        )}
      >
        {/* ── Desktop sidebar ──────────────────────────────────── */}
        <div className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
          <aside
            className={cn(
              "flex flex-col rounded-xl border border-brand/10 bg-paper p-3 min-h-[calc(100dvh-9rem)] transition-all duration-300",
              collapsed ? "items-center" : "",
            )}
          >
            {/* Header / collapse toggle */}
            <div className={cn(
              "flex items-center border-b border-brand/10 pb-3",
              collapsed ? "justify-center w-full" : "justify-between px-3",
            )}>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.16em] text-accent uppercase">Member</p>
                  <p className="mt-1 truncate font-display text-xl text-brand">{name}</p>
                </div>
              )}
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-mist hover:text-brand transition-colors",
                  collapsed && "rotate-180",
                )}
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="mt-3 grid gap-0.5 w-full" aria-label="Member">
              <SidebarNavLinks pathname={pathname} collapsed={collapsed} />
            </nav>

            {/* Sign out — pinned to bottom */}
            <form action={logoutAction} className="mt-auto w-full border-t border-brand/10 pt-3">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                {collapsed ? (
                  <span aria-label="Sign out" className="text-xs">↗</span>
                ) : (
                  "Sign out"
                )}
              </Button>
            </form>
          </aside>
        </div>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="min-w-0 px-4 py-4 pb-20 sm:px-6 lg:px-0 lg:py-1 lg:pb-1">{children}</div>
      </div>

      {/* ── Mobile bottom dock ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand/10 bg-canvas/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Member"
      >
        <div className="flex items-center justify-around px-1 py-1">
          <MobileNavLinks pathname={pathname} />
        </div>
      </nav>
    </div>
  );
}
