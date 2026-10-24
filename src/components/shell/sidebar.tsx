"use client";

import { ArrowRight, ArrowUpRight, Bell, ChevronLeft, ChevronRight, LogIn, LogOut, Monitor, Moon, Search, Store, Sun, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";

import { BrandMark } from "./brand-mark";
import { ACCOUNT, EXPLORE, INFO_LINKS, isActive, type NavItem } from "./nav";
import { openSearch } from "./search-dialog";
import { SOCIALS } from "./social-icons";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const useMounted = () =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

/** Below 1280px the desktop sidebar is always the icon rail. */
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1280px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1280px)").matches,
    () => true,
  );
}

/** The brand entry: manage your brand, or create one. */
function useBrandEntry() {
  const { signedIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });
  const isBrand = Boolean(me.data?.creator && !me.data.creator.notCreatorButSeller);
  const base = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  return isBrand
    ? {
        label: me.data?.creator?.name ?? "My studio",
        hint: "Open your studio",
        href: base,
        logo: me.data?.creator?.profileUrl ?? null,
      }
    : {
        label: "Create a brand",
        hint: "Launch drops, earn royalties",
        href: `${base}/onboarding`,
        logo: null,
      };
}

function useUnseen() {
  const { signedIn } = useRequireAuth();
  const unseen = api.notification.unseenCount.useQuery(undefined, {
    enabled: signedIn,
    refetchInterval: 60_000,
  });
  return signedIn ? (unseen.data ?? 0) : 0;
}

/* ─── expanded pieces ─────────────────────────────────────────────────────── */

/** FC88 menu row: a giant condensed word and an arrow in an ink circle. */
function BigNavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className="group flex items-center justify-between gap-3 py-1.5">
      <span className="relative">
        <span className="display block text-[2.15rem] transition-transform duration-200 group-hover:translate-x-1">{item.label}</span>
        {active && (
          <svg aria-hidden viewBox="0 0 120 10" preserveAspectRatio="none" className="text-side-ink absolute -bottom-1.5 left-0 h-2.5 w-full">
            <path d="M2 6 C 30 1, 60 9, 118 3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:-rotate-45",
          active ? "bg-side-mint text-side-ink" : "bg-side-ink text-side",
        )}
      >
        <ArrowRight className="size-5" strokeWidth={2.6} />
      </span>
    </Link>
  );
}

/** A chunky ink chip for the signed-in pages (Collection, Wallet…). */
function ChipLink({ item, active, badge, onNavigate }: { item: NavItem; active: boolean; badge?: number; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "blob relative flex h-10 items-center gap-2 px-3 text-[13px] font-bold transition-transform duration-200 hover:-translate-y-0.5",
        active ? "bg-side-mint text-side-ink" : "bg-side-ink/90 text-side-mint hover:bg-side-ink",
      )}
    >
      <item.icon className="size-4 shrink-0" strokeWidth={2.4} />
      <span className="truncate">{item.label}</span>
      {badge ? <span className="bg-pink text-side-ink ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold">{badge > 99 ? "99+" : badge}</span> : null}
    </Link>
  );
}

const iconButton = "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-side-ink text-side transition-transform duration-200 hover:scale-110";

/** Search (opens the ⌘K palette) and notifications, as two ink circles beside the logo. */
function QuickIcons({ onNavigate }: { onNavigate?: () => void }) {
  const { signedIn } = useRequireAuth();
  const unseen = useUnseen();
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" onClick={openSearch} title="Search (⌘K)" aria-label="Search" className={iconButton}>
        <Search className="size-[18px]" strokeWidth={2.6} />
      </button>
      {signedIn && (
        <Link href="/notifications" onClick={onNavigate} aria-label={unseen ? `Notifications (${unseen} new)` : "Notifications"} title="Notifications" className={iconButton}>
          <Bell className="size-[18px]" strokeWidth={2.6} />
          {unseen > 0 && (
            <span className="bg-pink text-side-ink ring-side absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2">
              {unseen > 9 ? "9+" : unseen}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

function Avatar({ image, size = "size-11" }: { image: string | null; size?: string }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className={cn(size, "border-side shrink-0 rounded-full border-2 object-cover")} />
  ) : (
    <span className={cn(size, "border-side bg-side text-side-ink flex shrink-0 items-center justify-center rounded-full border-2")}>
      <User className="size-5" strokeWidth={2.4} />
    </span>
  );
}

/** Who you are and what you hold, as an ink card. Signed out: a big sign-in button. */
function PlayerCard({ onNavigate }: { onNavigate?: () => void }) {
  const { signedIn, loading, session, openSignIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });
  const balances = api.wallet.balances.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 30_000,
  });

  if (loading) return <div className="blob bg-side-ink/15 h-[178px]" />;

  if (!signedIn)
    return (
      <div className="blob bg-side-ink text-side-mint p-3">
        <div className="flex items-center gap-3">
          <Avatar image={null} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-bold">Hey, guest!</p>
            <p className="marker text-side-mint/60 text-[11px]">collecting starts here</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openSignIn}
          className="blob bg-side text-side-ink mt-3 flex h-11 w-full items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <LogIn className="size-4" strokeWidth={2.6} />
          <span className="marker text-base">Sign in / Sign up</span>
        </button>
        <StudioRow onNavigate={onNavigate} />
      </div>
    );

  const id = session?.user.id;
  const name = me.data?.name ?? session?.user.name ?? "Collector";
  const b = balances.data;

  return (
    <div className="blob bg-side-ink text-side-mint p-3">
      <div className="flex items-center gap-3">
        <Link href="/settings" onClick={onNavigate} aria-label="Settings">
          <Avatar image={me.data?.image ?? session?.user.image ?? null} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-bold">{name}</p>
          {id && <p className="text-side-mint/55 truncate font-mono text-[11px]">{addrShort(id, 5)}</p>}
        </div>
      </div>
      <div className="border-side-mint/20 mt-3 border-t border-dashed pt-2.5">
        <Link href="/wallet" onClick={onNavigate} className="block min-w-0">
          <p className="text-side-mint/55 text-[10px] font-bold tracking-[0.16em] uppercase">Balance</p>
          {!b ? (
            <span className="bg-side-mint/10 mt-1 block h-7 w-24 rounded" />
          ) : b.active ? (
            <p className="flex items-baseline gap-1.5 truncate">
              <span className="display text-side text-[1.9rem]">{full.format(b.platform.balance)}</span>
              <span className="marker text-side-mint/70 text-xs">{b.platform.code}</span>
            </p>
          ) : (
            <p className="marker text-side mt-1 text-sm">Activate wallet →</p>
          )}
        </Link>
      </div>
      <StudioRow onNavigate={onNavigate} />
    </div>
  );
}

/** The brand entry, as the last row of the ink card: the studio's logo and name (or "Create a brand"), opening the brand portal. */
function StudioRow({ onNavigate }: { onNavigate?: () => void }) {
  const brand = useBrandEntry();
  return (
    <a
      href={brand.href}
      target="_blank"
      rel="noreferrer"
      onClick={onNavigate}
      className="group bg-side-mint/10 hover:bg-side-mint/20 mt-2.5 flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition-colors"
    >
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="bg-side text-side-ink flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Store className="size-[18px]" strokeWidth={2.4} />
        </span>
      )}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-bold">{brand.label}</span>
        <span className="text-side-mint/60 block truncate text-[11px]">{brand.hint}</span>
      </span>
      <ArrowUpRight className="text-side size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.6} />
    </a>
  );
}

/** The fixed footer: theme, info pages, socials, sign out and the copyright, kept compact. */
function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { signedIn } = useRequireAuth();
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <ThemeSwitch />
        <div className="flex gap-1">
          {SOCIALS.map((so) => (
            <a
              key={so.href}
              href={so.href}
              target="_blank"
              rel="noreferrer"
              aria-label={so.label}
              className="bg-side-ink text-side flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110"
            >
              <so.icon className="size-3" />
            </a>
          ))}
        </div>
      </div>
      <div className="text-side-ink/75 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
        {INFO_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={onNavigate} className="hover:text-side-ink hover:underline">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="border-side-ink/20 flex items-center justify-between gap-2 border-t-2 border-dashed pt-2.5">
        <span className="text-side-ink/60 text-[11px] font-semibold">© {new Date().getFullYear()} Wadzzo</span>
        {signedIn && (
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="bg-side-ink/10 hover:bg-side-ink hover:text-side flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold transition-colors"
          >
            <LogOut className="size-3" strokeWidth={2.6} /> Sign out
          </button>
        )}
      </div>
    </div>
  );
}

function ThemeSwitch({ vertical = false }: { vertical?: boolean }) {
  const { theme: stored, setTheme } = useTheme();
  const mounted = useMounted();
  // next-themes only knows the theme on the client; until then render the default so markup matches the server
  const theme = mounted ? stored : "dark";
  if (vertical) {
    const i = Math.max(
      0,
      THEMES.findIndex((t) => t.id === theme),
    );
    const current = THEMES[i]!;
    const next = THEMES[(i + 1) % THEMES.length]!;
    return (
      <button
        type="button"
        onClick={() => setTheme(next.id)}
        title={`Theme: ${current.label}`}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        className="text-side-ink/70 hover:bg-side-ink/10 hover:text-side-ink flex size-10 items-center justify-center rounded-full transition-colors"
      >
        <current.icon className="size-4" strokeWidth={2.4} />
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" className="bg-side-ink/10 flex gap-0.5 rounded-full p-0.5">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={theme === t.id}
          aria-label={t.label}
          title={t.label}
          onClick={() => setTheme(t.id)}
          className={cn("flex size-7 items-center justify-center rounded-full transition-colors", theme === t.id ? "bg-side-ink text-side" : "text-side-ink/60 hover:text-side-ink")}
        >
          <t.icon className="size-3.5" strokeWidth={2.4} />
        </button>
      ))}
    </div>
  );
}

/* ─── body ────────────────────────────────────────────────────────────────── */

/** Everything the app navigates with (the app has no header); the desktop sidebar and the phone drawer both render this. */
export function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const { signedIn } = useRequireAuth();
  const account = ACCOUNT.filter((i) => signedIn || !i.authOnly);

  return (
    <div className="text-side-ink flex h-full min-h-0 flex-col">
      {/* fixed header (in the phone drawer, leave room for the sheet's close button) */}
      <div className={cn("flex shrink-0 items-center justify-between gap-2 px-5 pt-6 pb-4", onNavigate && "pr-14")}>
        <BrandMark />
        <QuickIcons onNavigate={onNavigate} />
      </div>

      {/* scrolling body */}
      <div className="no-scrollbar border-side-ink/20 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain border-y-2 border-dashed px-5 py-5">
        <PlayerCard onNavigate={onNavigate} />

        <nav aria-label="Sections">
          {EXPLORE.map((item, i) => (
            <div key={item.href}>
              {i > 0 && <div className="dash-rule my-1.5" role="separator" />}
              <BigNavLink item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
            </div>
          ))}
        </nav>

        {signedIn && (
          <div>
            <p className="marker mb-2 -rotate-2 text-sm">*your stuff*</p>
            <div className="grid grid-cols-2 gap-2">
              {account.map((item) => (
                <ChipLink key={item.href} item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* fixed footer */}
      <div className="shrink-0 px-5 pt-3 pb-[max(1rem,var(--safe-bottom))]">
        <SidebarFooter onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/* ─── icon rail ───────────────────────────────────────────────────────────── */

function RailLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110",
        active ? "bg-side-mint text-side-ink" : "bg-side-ink text-side",
      )}
    >
      <item.icon className="size-5" strokeWidth={2.4} />
      {badge ? <span className="bg-pink ring-side absolute -top-0.5 -right-0.5 size-3 rounded-full ring-2" /> : null}
    </Link>
  );
}

/** The collapsed sidebar: the same green block as a column of ink circles. */
function SidebarRail() {
  const pathname = usePathname() ?? "";
  const { signedIn, openSignIn, session } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });
  const unseen = useUnseen();
  const brand = useBrandEntry();
  const account = ACCOUNT.filter((i) => signedIn || !i.authOnly);

  return (
    <div className="text-side-ink flex h-full flex-col items-center">
      <div className="flex shrink-0 flex-col items-center gap-3 px-2 pt-5 pb-3">
        <BrandMark compact />
        <button type="button" onClick={openSearch} title="Search (⌘K)" aria-label="Search" className={iconButton}>
          <Search className="size-[18px]" strokeWidth={2.6} />
        </button>
        {signedIn && (
          <Link href="/notifications" title="Notifications" aria-label={unseen ? `Notifications (${unseen} new)` : "Notifications"} className={iconButton}>
            <Bell className="size-[18px]" strokeWidth={2.6} />
            {unseen > 0 && (
              <span className="bg-pink text-side-ink ring-side absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2">
                {unseen > 9 ? "9+" : unseen}
              </span>
            )}
          </Link>
        )}
      </div>
      <div className="no-scrollbar border-side-ink/20 flex min-h-0 w-full flex-1 flex-col items-center gap-3 overflow-y-auto border-y-2 border-dashed py-3 [&>*]:shrink-0">
        {signedIn ? (
          <Link href="/wallet" title="Wallet" aria-label="Wallet">
            <Avatar image={me.data?.image ?? session?.user.image ?? null} />
          </Link>
        ) : (
          <button type="button" onClick={openSignIn} title="Sign in" aria-label="Sign in" className="blob bg-side-ink text-side-mint flex size-11 items-center justify-center">
            <LogIn className="size-5" strokeWidth={2.6} />
          </button>
        )}
        <div className="dash-rule w-8" />
        {EXPLORE.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(pathname, item)} />
        ))}
        <div className="dash-rule w-8" />
        {account.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(pathname, item)} />
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2 px-2 pt-3 pb-4">
        <a href={brand.href} target="_blank" rel="noreferrer" title={brand.label} aria-label={brand.label} className="blob bg-side-mint text-side-ink flex size-11 items-center justify-center">
          <Store className="size-5" strokeWidth={2.4} />
        </a>
        <ThemeSwitch vertical />
      </div>
    </div>
  );
}

/** The fixed desktop sidebar (md and up): the full green block on wide screens, an icon rail otherwise or when collapsed. */
export function DesktopSidebar() {
  const { collapsed: stored, setCollapsed } = useSidebarCollapsed();
  const wide = useWide();
  const collapsed = stored || !wide;
  return (
    <aside className={cn("bg-side sticky top-0 z-40 hidden h-dvh shrink-0 md:block", collapsed ? "w-[5.25rem]" : "w-[19.5rem]")}>
      {collapsed ? <SidebarRail /> : <SidebarBody />}
      {wide && (
        <button
          type="button"
          onClick={() => setCollapsed(!stored)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="border-side bg-side-ink text-side absolute top-1/2 -right-3.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
        >
          {collapsed ? <ChevronRight className="size-4" strokeWidth={2.6} /> : <ChevronLeft className="size-4" strokeWidth={2.6} />}
        </button>
      )}
    </aside>
  );
}
