import { Home, Layers, Newspaper, Store, Target, type LucideIcon } from "lucide-react";

/**
 * Bottom navigation on every screen size (app-style). The brand entry
 * (Manage brand / Create brand) is added after these; everything else lives
 * in the account menu.
 */
export type NavItem = { href: string; label: string; icon: LucideIcon; match?: string[] };

export const TABS: NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: ["/creators", "/creator"] },
  { href: "/marketplace", label: "Market", icon: Store, match: ["/item"] },
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/bounties", label: "Bounties", icon: Target },
  { href: "/feed", label: "Feed", icon: Newspaper, match: ["/posts"] },
];


export function isActive(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/" || (item.match ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));
}
