import type { ReactNode } from "react";

import { MarketTicker } from "./market-ticker";
import { MobileTabs } from "./mobile-tabs";
import { SearchDialog } from "./search-dialog";
import { DesktopSidebar } from "./sidebar";

/**
 * No header and no footer: the green sidebar holds everything (search,
 * wallet, notifications, navigation, account); a market ticker runs across
 * the top of the page. Phones get a tab bar whose Menu opens the same
 * sidebar as a drawer.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh">
      <DesktopSidebar />
      <main id="main" className="min-w-0 flex-1 pb-[calc(6rem+var(--safe-bottom))] pt-[env(safe-area-inset-top)] md:pb-0">
        <MarketTicker />
        {children}
      </main>
      <MobileTabs />
      <SearchDialog />
    </div>
  );
}
