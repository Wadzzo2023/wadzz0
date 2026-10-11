"use client";

import { Activity, Bell, Check, HelpCircle, Info, LifeBuoy, LogIn, LogOut, Monitor, Moon, Settings, Shield, Sun, User, Users, Wallet } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

const ACCOUNT_LINKS = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** What used to be the footer: browsing and site links, available to everyone. */
const SITE_LINKS = [
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/about", label: "About", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/privacy", label: "Privacy", icon: Shield },
];

const SOCIALS = [
  { href: "https://x.com/WadzzoApp", label: "X" },
  { href: "https://www.instagram.com/wadzzo", label: "Instagram" },
  { href: "https://facebook.com/wadzzo", label: "Facebook" },
];

/** The avatar menu in the header: account, site links, theme, sign in/out. */
export function UserMenu() {
  const { signedIn, loading, session, openSignIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { enabled: signedIn });
  const { theme, setTheme } = useTheme();

  if (loading) return <div className="skeleton size-9 rounded-full" />;

  const id = session?.user.id;
  const name = me.data?.name ?? session?.user.name ?? "Your account";
  const image = me.data?.image ?? session?.user.image ?? undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/40" aria-label="Menu">
        <Avatar className="size-9">
          {signedIn && <AvatarImage src={image} alt="" />}
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[80dvh] w-64 overflow-y-auto">
        {signedIn ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm font-semibold">{name}</span>
              {id && <span className="block truncate font-mono text-[11px] text-muted-foreground">{addrShort(id, 6)}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ACCOUNT_LINKS.map((l) => (
              <DropdownMenuItem key={l.href} asChild className="gap-2">
                <Link href={l.href}>
                  <l.icon className="size-4" /> {l.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <DropdownMenuItem onSelect={openSignIn} className="gap-2 font-semibold text-primary focus:text-primary">
            <LogIn className="size-4" /> Sign in / Sign up
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {SITE_LINKS.map((l) => (
          <DropdownMenuItem key={l.href} asChild className="gap-2">
            <Link href={l.href}>
              <l.icon className="size-4" /> {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="label-caps">Theme</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-1 rounded-md py-1.5 text-xs ${theme === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              aria-pressed={theme === t.id}
            >
              {theme === t.id ? <Check className="size-4" /> : <t.icon className="size-4" />}
              {t.label}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Wadzzo</span>
          <span className="flex gap-2.5">
            {SOCIALS.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {s.label}
              </a>
            ))}
          </span>
        </div>
        {signedIn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
