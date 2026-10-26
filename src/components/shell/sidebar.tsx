"use client";

import { ArrowRight, Bell, ChevronLeft, ChevronRight, Contrast, LogIn, LogOut, Monitor, Moon, Search, Store, Sun, User, Wallet } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { formatTokenShort } from "~/lib/money";
import { WadzzoMark } from "~/ui/wadzzo-mark";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";

import { BrandMark } from "./brand-mark";
import { AppDownload } from "./app-download";
import { ArLaunchButton, BrandLaunchButton, type BrandEntry } from "./ar-launch-button";
import { ACCOUNT, EXPLORE, INFO_LINKS, isActive, type NavItem } from "./nav";
import { openSearch } from "./search-dialog";
import { SOCIALS } from "./social-icons";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "contrast", label: "High contrast", icon: Contrast },
  { id: "system", label: "System", icon: Monitor },
] as const;

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
function useBrandEntry(): BrandEntry {
  const { signedIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });
  const isBrand = Boolean(me.data?.creator && !me.data.creator.notCreatorButSeller);
  const base = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  return isBrand
    ? {
        isBrand: true,
        name: me.data?.creator?.name ?? null,
        hint: "Open your studio",
        href: base,
        logo: me.data?.creator?.profileUrl ?? null,
      }
    : {
        isBrand: false,
        name: null,
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
        "blob relative flex h-8 min-w-0 flex-auto items-center justify-center gap-1 px-1.5 text-[11px] font-bold transition-transform duration-200 hover:-translate-y-0.5",
        active ? "bg-side-mint text-side-ink" : "bg-side-ink/90 text-side-mint hover:bg-side-ink",
      )}
    >
      <item.icon className="size-3.5 shrink-0" strokeWidth={2.4} />
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

/** Perforated tear line between the two halves of the ticket card: a dashed rule with a notch cut out at each edge. */
function TearLine() {
  return (
    <div className="relative my-3" aria-hidden>
      <div className="dash-rule text-side-mint" />
      <span className="bg-side absolute top-1/2 -left-[1.125rem] size-3 -translate-y-1/2 rounded-full" />
      <span className="bg-side absolute top-1/2 -right-[1.125rem] size-3 -translate-y-1/2 rounded-full" />
    </div>
  );
}

/**
 * The wallet card at the top of the sidebar: the platform-token balance big, its dollar value and
 * spendable XLM underneath, opening the wallet. Signed out: a guest ticket with a sign-in button.
 */
function PlayerCard({ onNavigate }: { onNavigate?: () => void }) {
  const { signedIn, loading, openSignIn } = useRequireAuth();
  const balances = api.wallet.balances.useQuery(undefined, {
    enabled: signedIn,
    staleTime: 30_000,
  });

  if (loading) return <div className="blob bg-side-ink/15 h-[104px]" />;

  if (!signedIn)
    return (
      <div className="blob bg-side-ink text-side-mint overflow-hidden">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <span className="-rotate-3">
              <Avatar image={null} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="marker text-side-mint/60 text-[11px]">*guest pass*</p>
              <p className="display text-3xl">Hey, guest!</p>
            </div>
          </div>
          <TearLine />
          <button type="button" onClick={openSignIn} className="blob bg-side text-side-ink flex h-11 w-full items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5">
            <LogIn className="size-4" strokeWidth={2.6} />
            <span className="marker text-base">Sign in / Sign up</span>
          </button>
        </div>
      </div>
    );

  const b = balances.data;
  const usd = b?.active ? b.platform.usd : null;

  return (
    <Link href="/wallet" onClick={onNavigate} className="group blob bg-side-ink text-side-mint block p-3 transition-transform duration-200 hover:-translate-y-0.5">
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="bg-side text-side-ink flex size-7 items-center justify-center rounded-full">
            <Wallet className="size-3.5" strokeWidth={2.6} />
          </span>
          <span className="label-caps text-side-mint/70 text-[10px]">Balance</span>
        </span>
        <span className="text-side flex items-center gap-1 text-[11px] font-bold">
          Wallet
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.8} />
        </span>
      </span>

      {!b ? (
        <span className="mt-3 block space-y-1.5" aria-label="Loading balance">
          <span className="bg-side-mint/10 block h-8 w-32 rounded-md" />
          <span className="bg-side-mint/10 block h-3 w-24 rounded" />
        </span>
      ) : b.active ? (
        <>
          <span className="text-side mt-2.5 flex items-center gap-2" title={`${b.platform.balance.toLocaleString("en-US")} ${b.platform.code}`}>
            <span className="display truncate text-4xl leading-none tabular-nums">
              {/* the card fits ~8 characters at this size: 18,234.17 → 18.2K */}
              {formatTokenShort(b.platform.balance, 10_000)}
            </span>
            <WadzzoMark className="h-6 shrink-0" />
            <span className="sr-only">{b.platform.code}</span>
          </span>
          <span className="text-side-mint/60 mt-1.5 flex gap-1.5 truncate text-[11px] font-semibold tabular-nums">
            {usd != null && <span>≈ ${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>}
            {usd != null && <span aria-hidden>·</span>}
            <span>{b.xlm.spendable.toLocaleString("en-US", { maximumFractionDigits: 2 })} XLM</span>
          </span>
        </>
      ) : (
        <span className="mt-2.5 block leading-tight">
          <span className="display text-side block text-2xl">Activate wallet</span>
          <span className="text-side-mint/60 block text-[11px] font-semibold">Fund your account to start collecting</span>
        </span>
      )}
    </Link>
  );
}

/** The fixed footer: theme, info pages, socials, sign out and the copyright, kept compact. */
/** Who is signed in, as one row: picture, name and wallet address (opening the wallet dialog), and sign out. */
function ProfileRow({ onNavigate }: { onNavigate?: () => void }) {
  const { session, openSignIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { staleTime: 5 * 60_000 });
  const id = session?.user.id;
  const name = me.data?.name ?? session?.user.name ?? "Collector";
  return (
    <div className="bg-side-ink text-side-mint flex items-center gap-2 rounded-xl p-1.5">
      {/* picture, name and id together open the wallet dialog (your account and switching) */}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          openSignIn();
        }}
        title="Account & wallets"
        className="group hover:bg-side-mint/10 -m-0.5 flex min-w-0 flex-1 items-center gap-2 rounded-lg p-0.5 text-left transition-colors"
      >
        <Avatar image={me.data?.image ?? session?.user.image ?? null} size="size-8" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="display text-side truncate text-base group-hover:underline">{name}</p>
          {id && <p className="text-side-mint/60 truncate font-mono text-[10px]">{addrShort(id, 5)}</p>}
        </div>
      </button>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        aria-label="Sign out"
        title="Sign out"
        className="bg-side text-side-ink flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 hover:scale-105"
      >
        <LogOut className="size-3.5" strokeWidth={2.6} />
      </button>
    </div>
  );
}

/**
 * The fixed footer: your stuff and who you are, then theme and socials, the info pages on one
 * row, and the copyright last.
 */
function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const { signedIn } = useRequireAuth();
  // the wallet is the balance card, so the chips skip it
  const account = ACCOUNT.filter((i) => (signedIn || !i.authOnly) && i.href !== "/wallet");
  return (
    <div className="space-y-2">
      {signedIn && (
        <div>
          <p className="marker mb-1.5 -rotate-2 text-xs">*your stuff*</p>
          {/* sized by label, so "Collection" gets the room it needs */}
          <div className="flex gap-1.5">
            {account.map((item) => (
              <ChipLink key={item.href} item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}
      {signedIn && <ProfileRow onNavigate={onNavigate} />}
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
              className="bg-side-ink text-side flex size-6 items-center justify-center rounded-full transition-transform hover:scale-110"
            >
              <so.icon className="size-2.5" />
            </a>
          ))}
        </div>
      </div>
      <AppDownload />
      {/* info pages and the copyright share the last row */}
      <div className="border-side-ink/20 flex items-center justify-between gap-2 border-t-2 border-dashed pt-2 text-[9px] leading-none whitespace-nowrap">
        <div className="text-side-ink/70 flex gap-1.5 font-medium">
          {INFO_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={onNavigate} className="hover:text-side-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </div>
        <span className="text-side-ink/60 font-medium">© {new Date().getFullYear()} Wadzzo</span>
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
          className={cn("flex size-6 items-center justify-center rounded-full transition-colors", theme === t.id ? "bg-side-ink text-side" : "text-side-ink/60 hover:text-side-ink")}
        >
          <t.icon className="size-3" strokeWidth={2.4} />
        </button>
      ))}
    </div>
  );
}

/* ─── body ────────────────────────────────────────────────────────────────── */

/** Everything the app navigates with (the app has no header); the desktop sidebar and the phone drawer both render this. */
export function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const brand = useBrandEntry();

  return (
    <div className="text-side-ink flex h-full min-h-0 flex-col">
      {/* fixed header (in the phone drawer, leave room for the sheet's close button) */}
      <div className={cn("flex shrink-0 items-center justify-between gap-2 px-5 pt-6 pb-4", onNavigate && "pr-14")}>
        <BrandMark />
        <QuickIcons onNavigate={onNavigate} />
      </div>

      {/* scrolling body */}
      <div className="no-scrollbar border-side-ink/20 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain border-y-2 border-dashed px-5 py-5">
        <nav aria-label="Sections">
          {EXPLORE.map((item, i) => (
            <div key={item.href}>
              {i > 0 && <div className="dash-rule my-1.5" role="separator" />}
              <BigNavLink item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
            </div>
          ))}
        </nav>

        <div className="space-y-2.5">
          <ArLaunchButton onNavigate={onNavigate} />
          <BrandLaunchButton brand={brand} onNavigate={onNavigate} />
        </div>

        <PlayerCard onNavigate={onNavigate} />
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
        <a href={brand.href} target="_blank" rel="noreferrer" title={brand.isBrand ? (brand.name ?? "My studio") : "Create your brand"} aria-label={brand.isBrand ? (brand.name ?? "My studio") : "Create your brand"} className="blob bg-side-mint text-side-ink flex size-11 items-center justify-center">
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
    <aside className={cn("side-scope bg-side sticky top-0 z-40 hidden h-dvh shrink-0 md:block", collapsed ? "w-[5.25rem]" : "w-[19.5rem]")}>
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
