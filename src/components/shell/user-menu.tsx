"use client";

import { Activity, Bell, Check, ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun, User, Users, Wallet } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar";
import { Button } from "~/components/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

/** Avatar → account links, theme, sign out. Signed out: a Sign in button. */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { signedIn, loading, session, openSignIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { enabled: signedIn });
  const { theme, setTheme } = useTheme();

  if (loading) return <div className={cn("skeleton rounded-full", compact ? "size-8" : "h-11 w-full rounded-lg")} />;
  if (!signedIn) {
    return (
      <Button onClick={openSignIn} size={compact ? "sm" : "default"} className={cn(!compact && "w-full")}>
        Sign in
      </Button>
    );
  }

  const id = session?.user.id;
  const name = me.data?.name ?? session?.user.name ?? "Your account";
  const image = me.data?.image ?? session?.user.image ?? undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-accent", compact && "w-auto")}
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          <AvatarImage src={image} alt="" />
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{name}</span>
              {id && <span className="block truncate font-mono text-[10px] text-muted-foreground">{addrShort(id, 5)}</span>}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-semibold">{name}</span>
          {id && <span className="block truncate font-mono text-[11px] text-muted-foreground">{addrShort(id, 6)}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {[
          { href: "/wallet", label: "Wallet", icon: Wallet },
          { href: "/activity", label: "Activity", icon: Activity },
          { href: "/notifications", label: "Notifications", icon: Bell },
          { href: "/creators", label: "Creators", icon: Users },
          { href: "/settings", label: "Settings", icon: Settings },
        ].map((l) => (
          <DropdownMenuItem key={l.href} asChild className="gap-2">
            <Link href={l.href}>
              <l.icon className="size-4" /> {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="label-caps">Theme</DropdownMenuLabel>
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => setTheme(t.id)} className="gap-2">
            <t.icon className="size-4" />
            {t.label}
            {theme === t.id && <Check className="ml-auto size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
