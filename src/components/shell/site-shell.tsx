"use client";

import { Bell, Search, Store, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useState, type ReactNode } from "react";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

import { BrandMark } from "./brand-mark";
import { TABS, isActive, type NavItem } from "./nav";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";
import { WalletChip } from "./wallet-chip";

/**
 * App-style layout on every screen: a top bar (logo, search, balance,
 * notifications, account — the account menu also holds the site links) and
 * bottom tabs. No footer.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar />
      {/* bottom padding keeps content clear of the bottom tabs */}
      <main id="main" className="min-w-0 flex-1 pb-28">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}

function NotificationBell() {
  const { signedIn } = useRequireAuth();
  const unseen = api.notification.unseenCount.useQuery(undefined, { enabled: signedIn, refetchInterval: 60_000 });
  if (!signedIn) return null;
  const n = unseen.data ?? 0;
  return (
    <Link
      href="/notifications"
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={n ? `Notifications (${n} new)` : "Notifications"}
    >
      <Bell className="size-5" />
      {n > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {n > 9 ? "9+" : n}
        </span>
      )}
    </Link>
  );
}

function TopBar() {
  const [searching, setSearching] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <BrandMark compact className="sm:hidden" />
        <BrandMark className="hidden sm:flex" />
        <Suspense>
          <SearchBox className="mx-auto hidden w-full max-w-lg md:block" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button
            type="button"
            onClick={() => setSearching((s) => !s)}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label={searching ? "Close search" : "Search"}
            aria-expanded={searching}
          >
            {searching ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <WalletChip className="h-9 rounded-full px-3" compact />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
      {searching && (
        <div className="px-4 pb-3 md:hidden">
          <Suspense>
            <SearchBox autoFocus />
          </Suspense>
        </div>
      )}
    </header>
  );
}

/** The brand entry in the bottom nav: manage your brand, or create one. */
function useBrandEntry() {
  const { signedIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { enabled: signedIn, staleTime: 5 * 60_000 });
  const isBrand = Boolean(me.data?.creator && !me.data.creator.notCreatorButSeller);
  const base = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  return isBrand
    ? { label: "My brand", href: base, logo: me.data?.creator?.profileUrl ?? null, name: me.data?.creator?.name ?? null }
    : { label: "Create brand", href: `${base}/onboarding`, logo: null, name: null };
}

/**
 * Bottom navigation: a floating glass pill of icon tabs. The active tab grows
 * into a green capsule with its label, and the capsule glides between tabs.
 * The brand entry is a matching glass orb beside the pill with the brand's logo.
 */
function BottomTabs() {
  const pathname = usePathname() ?? "";
  const brand = useBrandEntry();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(var(--safe-bottom)+0.75rem)] sm:pb-5">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        className="pointer-events-auto flex max-w-full items-center gap-2.5"
      >
        <nav
          aria-label="Sections"
          className="glass flex items-center gap-0.5 rounded-full p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
        >
          {TABS.map((t) => (
            <Tab key={t.href} item={t} active={isActive(pathname, t)} />
          ))}
        </nav>
        <BrandButton brand={brand} />
      </motion.div>
    </div>
  );
}

/** Manage / create your brand: a glass orb (same material as the pill) showing the brand's logo. */
function BrandButton({ brand }: { brand: { label: string; href: string; logo: string | null; name: string | null } }) {
  return (
    <a
      href={brand.href}
      target="_blank"
      rel="noreferrer"
      aria-label={brand.label}
      className="glass group relative flex size-[3.75rem] shrink-0 items-center justify-center rounded-full p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 active:scale-95"
    >
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt="" className="size-full rounded-full object-cover" />
      ) : brand.name ? (
        <span className="flex size-full items-center justify-center rounded-full bg-primary/12 font-hud text-lg font-bold text-primary">{brand.name.trim()[0]?.toUpperCase()}</span>
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store className="size-5" />
        </span>
      )}
      <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background opacity-0 shadow-md transition-[opacity,transform] group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100">
        {brand.label}
      </span>
    </a>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "relative flex h-12 items-center rounded-full px-3 transition-colors sm:px-3.5",
        active ? "text-primary-foreground" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="bottom-tab-active"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-0 rounded-full bg-primary shadow-[0_0_20px_-2px_hsl(var(--primary)/0.7)]"
        />
      )}
      <span className="relative z-10 flex items-center">
        <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
        <AnimatePresence initial={false}>
          {active && (
            <motion.span
              key="label"
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
              animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="overflow-hidden whitespace-nowrap text-sm font-semibold"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Link>
  );
}
