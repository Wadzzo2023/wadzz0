"use client";

import { Menu, Search } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "~/components/shadcn/ui/sheet";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

import { TABS, isActive } from "./nav";
import { openSearch } from "./search-dialog";
import { SidebarBody } from "./sidebar";

const tab = "relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wide transition-colors";

/**
 * Phones have no sidebar: a floating green tab bar instead (the sidebar's
 * colours), whose Menu tab opens the whole sidebar as a drawer. The active
 * tab gets a gliding ink capsule.
 */
export function MobileTabs() {
  const pathname = usePathname() ?? "";
  const [drawer, setDrawer] = useState(false);
  const { signedIn } = useRequireAuth();
  const unseen = api.notification.unseenCount.useQuery(undefined, { enabled: signedIn, refetchInterval: 60_000 });

  const activeTab = TABS.find((t) => isActive(pathname, t));

  return (
    <>
      <nav aria-label="Sections" className="fixed inset-x-3 bottom-[max(0.75rem,var(--safe-bottom))] z-40 md:hidden">
        <div className="side-scope blob mx-auto flex max-w-md items-center gap-1 bg-side p-1.5 text-side-ink shadow-[0_14px_30px_-12px_hsl(0_0%_0%/0.6)]">
          {TABS.map((t) => {
            const active = t === activeTab;
            return (
              <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={cn(tab, active ? "text-side" : "text-side-ink/75")}>
                {active && (
                  <motion.span layoutId="tab-active" layoutDependency={t.href} transition={{ type: "spring", stiffness: 460, damping: 36 }} className="absolute inset-0 rounded-2xl bg-side-ink" />
                )}
                <t.icon className="relative size-5" strokeWidth={2.4} />
                <span className="relative">{t.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={openSearch} className={cn(tab, "text-side-ink/75")}>
            <Search className="size-5" strokeWidth={2.4} />
            Search
          </button>
          <button type="button" onClick={() => setDrawer(true)} aria-label="Menu" className={cn(tab, "text-side-ink/75")}>
            <span className="relative">
              <Menu className="size-5" strokeWidth={2.4} />
              {(unseen.data ?? 0) > 0 && <span className="absolute -right-1 -top-0.5 size-2.5 rounded-full bg-pink ring-2 ring-side" />}
            </span>
            Menu
          </button>
        </div>
      </nav>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="side-scope flex w-[20rem] max-w-[88vw] flex-col gap-0 border-0 bg-side p-0 pt-[env(safe-area-inset-top)] text-side-ink sm:max-w-[20rem] [&>button:last-child]:text-side-ink">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Browse Wadzzo</SheetDescription>
          <SidebarBody onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
