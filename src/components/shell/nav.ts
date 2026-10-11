import { Activity, Home, Layers, Newspaper, Store, Target, Users, Wallet, type LucideIcon } from "lucide-react";

/**
 * Sidebar navigation. `MAIN` is browsing, `ACCOUNT` is the signed-in
 * wallet's own pages. Notifications are the bell in the header; Settings and
 * Sign out are in the avatar menu.
 */
export type NavItem = { href: string; label: string; icon: LucideIcon; match?: string[]; authOnly?: boolean };

export const MAIN: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Market", icon: Store, match: ["/item"] },
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/bounties", label: "Bounties", icon: Target },
  { href: "/feed", label: "Feed", icon: Newspaper, match: ["/posts"] },
  { href: "/creators", label: "Creators", icon: Users, match: ["/creator"] },
];

export const ACCOUNT: NavItem[] = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/activity", label: "Activity", icon: Activity },
];

/** Info pages, listed at the bottom of the sidebar. */
export const INFO_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
];

export function isActive(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/";
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));
}
