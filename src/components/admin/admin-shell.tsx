import Link from "next/link";
import Image from "next/image";
import { Activity, CalendarDays, ChevronRight, FileText, FolderKanban, HandHeart, ImageIcon, LayoutDashboard, Mail, Megaphone, Settings, ShieldCheck, Users, WalletCards } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { hasPermission, isPrimaryAdmin, type SessionUser } from "@/lib/auth";

const groups = [
  { label: "Overview", links: [{ href: "/admin", label: "Dashboard", permission: null, icon: LayoutDashboard }] },
  { label: "Fundraising", links: [{ href: "/admin/donations", label: "Donations", permission: "donations", icon: WalletCards }, { href: "/admin/projects", label: "Sponsored projects", permission: "programs", icon: FolderKanban }] },
  { label: "Content", links: [{ href: "/admin/pages", label: "Website pages", permission: "content", icon: FileText }, { href: "/admin/stories", label: "Stories & news", permission: "content", icon: Megaphone }, { href: "/admin/impact", label: "Impact figures", permission: "content", icon: Activity }, { href: "/admin/media", label: "Media library", permission: "content", icon: ImageIcon }, { href: "/admin/programs", label: "Programs", permission: "programs", icon: HandHeart }] },
  { label: "People", links: [{ href: "/admin/membership", label: "Membership", permission: "membership", icon: Users }, { href: "/admin/volunteers", label: "Volunteers", permission: "volunteers", icon: HandHeart }, { href: "/admin/events", label: "Events", permission: "events", icon: CalendarDays }, { href: "/admin/messages", label: "Messages", permission: "content", icon: Mail }, { href: "/admin/users", label: "Administrators", permission: "users", icon: ShieldCheck }] },
  { label: "System", links: [{ href: "/admin/settings", label: "Site settings", permission: "settings", icon: Settings }, { href: "/admin/notifications", label: "Email wording", permission: "settings", icon: Mail }, { href: "/admin/audit", label: "Activity log", permission: "users", icon: Activity }] },
];

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const primary = isPrimaryAdmin(user);
  const visibleGroups = groups.map((group) => ({ ...group, links: group.links.filter((link) => !link.permission || hasPermission(user, link.permission)) })).filter((group) => group.links.length);

  return <div className="min-h-full bg-[#f3f6f7] text-ink md:grid md:grid-cols-[17.5rem_minmax(0,1fr)]">
    <aside className="hidden min-h-screen bg-brand px-4 py-5 text-paper md:flex md:flex-col">
      <Link href="/admin" className="flex items-center gap-3 rounded-lg px-2 py-2"><Image src="/glai-mark.png" width={42} height={36} alt="" className="h-9 w-10 rounded-full bg-paper object-cover object-top" /><span><strong className="font-display text-2xl font-bold tracking-[-.06em]">GLAI</strong><small className="mt-0.5 block text-[10px] font-semibold tracking-[.18em] text-paper/55 uppercase">Admin portal</small></span></Link>
      <div className="mt-7 rounded-xl border border-paper/10 bg-paper/7 p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-sunshine text-xs font-extrabold text-ink">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="mt-0.5 truncate text-xs text-paper/60">{primary ? "Primary administrator" : "Administrator"}</p></div></div></div>
      <nav className="mt-7 space-y-5" aria-label="Admin">{visibleGroups.map((group) => <div key={group.label}><p className="px-3 text-[10px] font-bold tracking-[.18em] text-paper/45 uppercase">{group.label}</p><div className="mt-1 grid gap-0.5">{group.links.map((link) => { const Icon = link.icon; return <Link key={link.href} href={link.href} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-paper/70 transition hover:bg-paper/10 hover:text-paper"><Icon size={16} className="text-sunshine/85" />{link.label}<ChevronRight size={14} className="ml-auto opacity-0 transition group-hover:opacity-80" /></Link>; })}</div></div>)}</nav>
      <div className="mt-auto border-t border-paper/10 pt-4"><Link href="/" className="mb-3 flex items-center gap-2 px-3 text-xs font-semibold text-sunshine hover:text-paper">View public site ↗</Link><form action={logoutAction}><Button type="submit" variant="outline" size="sm" className="w-full rounded-lg border-paper/20 bg-transparent text-paper hover:bg-paper/10 hover:text-paper">Sign out</Button></form></div>
    </aside>
    <div className="min-w-0"><header className="border-b border-brand/10 bg-paper px-4 py-3 sm:px-6 lg:px-10"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4"><Link href="/admin" className="flex items-center gap-2 md:hidden"><Image src="/glai-mark.png" width={32} height={28} alt="" className="h-7 w-8 rounded-full bg-paper object-cover object-top" /><span className="font-display text-xl font-bold tracking-[-.06em] text-brand">GLAI</span></Link><div className="hidden md:block"><p className="text-xs font-semibold tracking-[.16em] text-accent uppercase">Operations console</p><p className="mt-1 text-sm text-muted">Manage the movement with care and clarity.</p></div><div className="flex items-center gap-3"><Link href="/" className="hidden rounded-lg border border-brand/10 px-3 py-2 text-xs font-semibold text-brand hover:bg-mist sm:block">View site ↗</Link><span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-[10px] font-bold text-paper">{initials}</span></div></div><nav className="mt-3 flex gap-3 overflow-x-auto pb-1 text-xs font-semibold text-brand md:hidden">{visibleGroups.flatMap((group) => group.links).map((link) => <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full bg-mist px-3 py-1.5">{link.label}</Link>)}</nav></header><main className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-10">{children}</main></div>
  </div>;
}

export function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-brand/10 bg-paper shadow-[0_14px_36px_-28px_rgba(6,29,75,.72)]"><table className="min-w-full text-left text-sm"><thead className="bg-[#fafcfc] text-[11px] font-semibold tracking-[.08em] text-muted uppercase"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-brand/8">{children}</tbody></table></div>;
}
