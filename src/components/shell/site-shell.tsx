"use client";

import { Bell, Search, X } from "lucide-react";
import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";

import { useRequireAuth } from "~/hooks/use-require-auth";
import { api } from "~/utils/api";

import { BrandMark } from "./brand-mark";
import { CurrencyToggle } from "./currency-toggle";
import { SearchBox } from "./search-box";
import { DesktopSidebar, MobileNav } from "./sidebar";
import { UserMenu } from "./user-menu";
import { WalletChip } from "./wallet-chip";

/**
 * Sidebar on large screens (collapsible to icons), a slide-in drawer on small
 * ones. The top bar holds search, balance, notifications and the account menu.
 * No bottom nav, no footer.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="min-w-0 flex-1 pb-[var(--safe-bottom)]">
          {children}
        </main>
      </div>
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
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <MobileNav />
        <BrandMark compact className="xl:hidden" />
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
          <CurrencyToggle className="hidden sm:flex" />
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
