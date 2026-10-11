"use client";

import { Bell, Search, Store, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

import { BrandMark } from "./brand-mark";
import { FOOTER_LINKS, TABS, isActive, type NavItem } from "./nav";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";
import { WalletChip } from "./wallet-chip";

/**
 * App-style layout on every screen: a top bar (logo, search, balance,
 * notifications, account) and bottom tabs. On the home page the hero fills
 * the screen and the top bar slides in once the visitor scrolls.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const immersive = pathname === "/";
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar immersive={immersive} />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
      <SiteFooter />
      <BottomTabs />
    </div>
  );
}

function useScrolledPast(px: number, enabled: boolean) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const on = () => setPast(window.scrollY > px);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [px, enabled]);
  return past;
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

function TopBar({ immersive }: { immersive: boolean }) {
  const [searching, setSearching] = useState(false);
  const scrolled = useScrolledPast(80, immersive);
  const hidden = immersive && !scrolled && !searching;

  return (
    <header
      className={cn(
        "z-40 border-b bg-background/85 backdrop-blur-md transition-transform duration-300 supports-[backdrop-filter]:bg-background/70",
        immersive ? "fixed inset-x-0 top-0" : "sticky top-0",
        hidden && "-translate-y-full",
      )}
      aria-hidden={hidden}
    >
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
          <UserMenu compact />
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
  return isBrand ? { label: "My brand", href: base } : { label: "Create brand", href: `${base}/onboarding` };
}

/** Bottom tabs: full-width bar on phones, a floating pill on larger screens. */
function BottomTabs() {
  const pathname = usePathname() ?? "";
  const brand = useBrandEntry();

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[var(--safe-bottom)] backdrop-blur-md supports-[backdrop-filter]:bg-card/85",
        "sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(40rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:pb-0 sm:shadow-xl sm:shadow-black/10",
      )}
    >
      <div className="flex h-16 items-stretch sm:px-2">
        {TABS.map((t) => (
          <Tab key={t.href} item={t} active={isActive(pathname, t)} />
        ))}
        <a
          href={brand.href}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          <span className="flex h-7 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Store className="size-4 shrink-0" />
          </span>
          <span className="w-full truncate px-0.5 text-center font-hud text-[10px] font-semibold uppercase leading-none tracking-wider">{brand.label}</span>
        </a>
      </div>
    </nav>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors active:scale-95", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
    >
      <span className={cn("flex h-7 w-11 items-center justify-center rounded-full transition-colors", active && "bg-primary/12")}>
        <Icon className="size-5 shrink-0" />
      </span>
      <span className="w-full truncate px-0.5 text-center font-hud text-[10px] font-semibold uppercase leading-none tracking-wider">{item.label}</span>
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t px-4 pb-28 pt-6 text-sm text-muted-foreground sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
        <span>© {new Date().getFullYear()} Wadzzo</span>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Footer">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <a href="https://x.com/WadzzoApp" target="_blank" rel="noreferrer" className="hover:text-foreground">
            X
          </a>
          <a href="https://www.instagram.com/wadzzo" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Instagram
          </a>
          <a href="https://facebook.com/wadzzo" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Facebook
          </a>
        </nav>
      </div>
    </footer>
  );
}
