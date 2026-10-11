import {
  Activity,
  Bell,
  Compass,
  Home,
  Layers,
  Newspaper,
  Settings,
  Store,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * The fan app's navigation, defined once: the desktop sidebar, the phone tab
 * bar and its "More" sheet all read from here.
 *
 * `auth`: only shown when signed in (they're about the viewer).
 */
export type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon; auth?: boolean; match?: string[] };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "Discover",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/marketplace", label: "Marketplace", shortLabel: "Market", icon: Store, match: ["/item"] },
      { href: "/creators", label: "Creators", icon: Users, match: ["/creator"] },
      { href: "/feed", label: "Feed", icon: Newspaper, match: ["/posts"] },
      { href: "/bounties", label: "Bounties", icon: Target },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/collection", label: "My collection", shortLabel: "Collection", icon: Layers, auth: true },
      { href: "/activity", label: "Activity", icon: Activity, auth: true },
      { href: "/wallet", label: "Wallet", icon: Wallet, auth: true },
      { href: "/notifications", label: "Notifications", icon: Bell, auth: true },
      { href: "/settings", label: "Settings", icon: Settings, auth: true },
    ],
  },
];

/** Phone tab bar: Home · Market · Collection · Bounties · More. */
export const MOBILE_TABS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Market", icon: Store, match: ["/item"] },
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/bounties", label: "Bounties", icon: Target },
];

export const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
];

export const EXPLORE_ICON = Compass;

export function isActive(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/";
  return [item.href, ...(item.match ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));
}
