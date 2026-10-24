import { Activity, Home, Layers, Newspaper, Settings, Store, Target, Wallet, type LucideIcon } from "lucide-react";

/**
 * Sidebar navigation (the app has no header: the sidebar holds everything).
 * `EXPLORE` is browsing, `ACCOUNT` is the signed-in wallet's own pages;
 * `authOnly` items are hidden when signed out. `TABS` are the phone tab bar's links (it adds Search and Menu).
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string[];
  authOnly?: boolean;
};

export const EXPLORE: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: Store, match: ["/item"] },
  { href: "/bounties", label: "Bounties", icon: Target },
  { href: "/feed", label: "Feed", icon: Newspaper, match: ["/posts"] },
];

export const ACCOUNT: NavItem[] = [
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/wallet", label: "Wallet", icon: Wallet, authOnly: true },
  { href: "/activity", label: "Activity", icon: Activity, authOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, authOnly: true },
];

export const TABS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Market", icon: Store, match: ["/item"] },
  { href: "/collection", label: "Collection", icon: Layers },
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
