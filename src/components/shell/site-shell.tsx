"use client";

import { Bell, MoreHorizontal, Search, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "~/components/shadcn/ui/drawer";
import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

import { BrandMark } from "./brand-mark";
import { FOOTER_LINKS, MOBILE_TABS, NAV, isActive, type NavItem } from "./nav";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";
import { WalletChip } from "./wallet-chip";

/**
 * The one layout for every page: sidebar on desktop, top bar + tab bar on
 * phones. Pages render immediately for everyone; anything personal asks the
 * visitor to sign in where it's needed.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
      <MobileTabBar />
    </div>
  );
}

function NotificationBell({ className }: { className?: string }) {
  const { signedIn } = useRequireAuth();
  const unseen = api.notification.unseenCount.useQuery(undefined, { enabled: signedIn, refetchInterval: 60_000 });
  if (!signedIn) return null;
  const n = unseen.data ?? 0;
  return (
    <Link href="/notifications" className={cn("relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground", className)} aria-label={n ? `Notifications (${n} new)` : "Notifications"}>
      <Bell className="size-5" />
      {n > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {n > 9 ? "9+" : n}
        </span>
      )}
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card lg:flex" aria-label="Site navigation">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <BrandMark />
        <NotificationBell />
      </div>
      <div className="space-y-2 p-3">
        <Suspense fallback={<div className="skeleton h-10 rounded-lg" />}>
          <SearchBox />
        </Suspense>
        <WalletChip />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Sections">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 font-hud text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(pathname, item)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <a
          href={env.NEXT_PUBLIC_BRAND_PORTAL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-semibold">Are you a creator?</span>
            <span className="block text-xs text-muted-foreground">Open the brand portal</span>
          </span>
        </a>
      </nav>
      <div className="border-t p-3">
        <UserMenu />
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function MobileTopBar() {
  const [searching, setSearching] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="flex h-14 items-center gap-2">
        <BrandMark compact />
        <span className="min-w-0 flex-1 font-hud text-base font-bold">Wadzzo</span>
        <button
          type="button"
          onClick={() => setSearching((s) => !s)}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Search"
          aria-expanded={searching}
        >
          <Search className="size-5" />
        </button>
        <NotificationBell />
        <UserMenu compact />
      </div>
      {searching && (
        <Suspense>
          <SearchBox className="pb-3" autoFocus />
        </Suspense>
      )}
    </header>
  );
}

function MobileTabBar() {
  const pathname = usePathname() ?? "";
  const [more, setMore] = useState(false);
  const inBar = new Set(MOBILE_TABS.map((t) => t.href));
  const moreGroups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !inBar.has(i.href)) })).filter((g) => g.items.length);
  const moreActive = moreGroups.some((g) => g.items.some((i) => isActive(pathname, i)));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[var(--safe-bottom)] backdrop-blur-sm supports-[backdrop-filter]:bg-card/85 lg:hidden"
        aria-label="Sections"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch">
          {MOBILE_TABS.map((t) => (
            <Tab key={t.href} item={t} active={isActive(pathname, t)} />
          ))}
          <button
            type="button"
            onClick={() => setMore(true)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors active:scale-95",
              moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="More sections"
          >
            <MoreHorizontal className="size-5 shrink-0" />
            <span className="font-hud text-[10px] font-semibold uppercase leading-none tracking-wider">More</span>
          </button>
        </div>
      </nav>
      <Drawer open={more} onOpenChange={setMore}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-hud">All sections</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 overflow-y-auto px-4 pb-6">
            <WalletChip />
            {moreGroups.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 px-1 font-hud text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">{g.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  {g.items.map((i) => {
                    const Icon = i.icon;
                    const active = isActive(pathname, i);
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        onClick={() => setMore(false)}
                        className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center", active ? "border-primary/40 bg-primary/10 text-primary" : "bg-surface-2")}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs font-medium leading-tight">{i.shortLabel ?? i.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-1 text-sm text-muted-foreground">
              {FOOTER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMore(false)} className="hover:text-foreground">
                  {l.label}
                </Link>
              ))}
              <a href={env.NEXT_PUBLIC_BRAND_PORTAL_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
                Brand portal
              </a>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors active:scale-95",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="w-full truncate text-center font-hud text-[10px] font-semibold uppercase leading-none tracking-wider">{item.shortLabel ?? item.label}</span>
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="hidden border-t px-8 py-6 text-sm text-muted-foreground lg:block">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Wadzzo</span>
        <nav className="flex flex-wrap gap-5" aria-label="Footer">
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
