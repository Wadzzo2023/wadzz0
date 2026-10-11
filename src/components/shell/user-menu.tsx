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

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
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
          <span className="flex items-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
                className="transition-colors hover:text-foreground"
              >
                <s.icon className="size-3.5" />
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
