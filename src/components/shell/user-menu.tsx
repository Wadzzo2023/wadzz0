"use client";

import { LogIn, LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";
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

/** The avatar menu in the header: settings and sign in/out. Navigation lives in the sidebar. */
export function UserMenu() {
  const { signedIn, loading, session, openSignIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { enabled: signedIn });

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
      <DropdownMenuContent align="end" className="max-h-[80dvh] w-56 overflow-y-auto">
        {signedIn ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm font-semibold">{name}</span>
              {id && <span className="block truncate font-mono text-[11px] text-muted-foreground">{addrShort(id, 6)}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2">
              <Link href="/settings">
                <Settings className="size-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={openSignIn} className="gap-2 font-semibold text-primary focus:text-primary">
            <LogIn className="size-4" /> Sign in / Sign up
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
