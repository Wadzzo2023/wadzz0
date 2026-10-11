"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, Menu, Monitor, Moon, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "~/components/shadcn/ui/sheet";
import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

import { BrandMark } from "./brand-mark";
import { CurrencyToggle } from "./currency-toggle";
import { ACCOUNT, INFO_LINKS, MAIN, isActive, type NavItem } from "./nav";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
      />
    </svg>
  );
}

const SOCIALS = [
  { href: "https://x.com/WadzzoApp", label: "X", icon: XIcon },
  { href: "https://www.instagram.com/wadzzo", label: "Instagram", icon: InstagramIcon },
  { href: "https://facebook.com/wadzzo", label: "Facebook", icon: FacebookIcon },
];

/** The brand entry: manage your brand, or create one. */
function useBrandEntry() {
  const { signedIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { enabled: signedIn, staleTime: 5 * 60_000 });
  const isBrand = Boolean(me.data?.creator && !me.data.creator.notCreatorButSeller);
  const base = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  return isBrand
    ? { label: "My brand", hint: "Creator studio", href: base, logo: me.data?.creator?.profileUrl ?? null, name: me.data?.creator?.name ?? null }
    : { label: "Create brand", hint: "Sell on Wadzzo", href: `${base}/onboarding`, logo: null, name: null };
}

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center" : "px-3",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );
}

function BrandCard({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const brand = useBrandEntry();
  const isBrand = brand.label === "My brand";
  const initial = brand.name?.trim()[0]?.toUpperCase();

  const mark = brand.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brand.logo} alt="" className="size-9 shrink-0 rounded-full object-cover ring-2 ring-primary/50" />
  ) : initial ? (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-hud text-base font-bold text-primary ring-2 ring-primary/50">{initial}</span>
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-primary-foreground">
      <Sparkles className="size-4" />
    </span>
  );

  return (
    <a
      href={brand.href}
      target="_blank"
      rel="noreferrer"
      onClick={onNavigate}
      title={collapsed ? brand.label : undefined}
      aria-label={collapsed ? brand.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl transition-all hover:-translate-y-0.5",
        collapsed ? "justify-center p-1.5" : "p-2.5",
        isBrand
          ? "bg-background ring-1 ring-primary/40 hover:ring-primary/70 hover:shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.7)]"
          : "bg-gradient-to-br from-primary to-[hsl(150_75%_38%)] text-primary-foreground shadow-[0_10px_26px_-10px_hsl(var(--primary)/0.8)]",
      )}
    >
      {isBrand && <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.22),transparent_65%)]" />}
      <span className="relative">{mark}</span>
      {!collapsed && (
        <span className="relative min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold">{brand.label}</span>
          <span className={cn("block truncate text-xs", isBrand ? "text-muted-foreground" : "text-primary-foreground/80")}>{brand.hint}</span>
        </span>
      )}
      {!collapsed && <ArrowUpRight className={cn("relative size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", isBrand ? "text-primary" : "text-primary-foreground/80")} />}
    </a>
  );
}

function ThemeSwitch({ collapsed }: { collapsed: boolean }) {
  const { theme: stored, setTheme } = useTheme();
  // next-themes only knows the theme on the client; until then render the default so markup matches the server
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const theme = mounted ? stored : "system";
  if (collapsed) {
    const i = Math.max(0, THEMES.findIndex((t) => t.id === theme));
    const current = THEMES[i]!;
    const next = THEMES[(i + 1) % THEMES.length]!;
    return (
      <button
        type="button"
        onClick={() => setTheme(next.id)}
        title={`Theme: ${current.label}`}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        className="flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <current.icon className="size-4" />
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-foreground/[0.04] p-1">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={theme === t.id}
          aria-label={t.label}
          title={t.label}
          onClick={() => setTheme(t.id)}
          className={cn(
            "flex h-7 items-center justify-center rounded-md transition-colors",
            theme === t.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <t.icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

/** Everything inside the sidebar; the desktop rail and the mobile drawer both render this. */
function SidebarBody({
  collapsed,
  onNavigate,
  showCurrency = false,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  showCurrency?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const { signedIn } = useRequireAuth();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain">
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center" : "px-4")}>
        <BrandMark compact={collapsed} />
      </div>

      <nav aria-label="Sections" className={cn("flex-1 space-y-1 pb-3", collapsed ? "px-2" : "px-3")}>
        {MAIN.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item)} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        {signedIn && (
          <>
            <div className="my-2 border-t border-foreground/[0.06]" role="separator" />
            {ACCOUNT.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item)} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>

      <div className={cn("shrink-0 space-y-3 pb-[max(0.75rem,var(--safe-bottom))]", collapsed ? "px-2" : "px-3")}>
        <BrandCard collapsed={collapsed} onNavigate={onNavigate} />
        {showCurrency && (
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">Show prices in</span>
            <CurrencyToggle />
          </div>
        )}
        <ThemeSwitch collapsed={collapsed} />
        {!collapsed && (
          <>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 px-1 text-[11px] text-muted-foreground">
              {INFO_LINKS.map((l, i) => (
                <span key={l.href} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden className="size-[3px] rounded-full bg-muted-foreground/50" />}
                  <Link href={l.href} onClick={onNavigate} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-foreground/[0.06] px-1 pt-3 text-[11px] text-muted-foreground">
              <span>© {new Date().getFullYear()} Wadzzo</span>
              <span className="flex items-center gap-3">
                {SOCIALS.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label} className="transition-colors hover:text-foreground">
                    <s.icon className="size-3.5" />
                  </a>
                ))}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The fixed sidebar on large screens: full width, or collapsed to icons. */
export function DesktopSidebar() {
  const { collapsed, setCollapsed } = useSidebarCollapsed();
  return (
    <aside
      className={cn(
        "sticky top-0 z-50 hidden h-dvh shrink-0 border-r border-foreground/[0.06] bg-background transition-[width] duration-200 xl:block",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <SidebarBody collapsed={collapsed} />
      {/* chevron on the sidebar's edge, level with the logo: collapses and expands */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className="absolute -right-3 top-5 flex size-6 items-center justify-center rounded-full border border-foreground/10 bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>
    </aside>
  );
}

/** The menu button (small screens) and the drawer it opens from the left. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground xl:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col gap-0 p-0 sm:max-w-72">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Browse Wadzzo</SheetDescription>
        <SidebarBody collapsed={false} showCurrency onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
