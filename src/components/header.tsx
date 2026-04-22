"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeftRight,
  ChevronDown,
  GlobeLock,
  Info,
  LogOut,
  Menu,
  UserCircle2,
  Headphones,
} from "lucide-react";

import { SiteAssetBalance } from "./marketplace/recharge/site_asset_bal";
import { Button } from "~/components/shadcn/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import Logo from "./logo";
import Hamburger from "./hamburger";

export type LayoutMode = "modern" | "legacy";

type HeaderProps = {
  layoutMode: LayoutMode;
  onToggleLayoutMode: () => void;
};

export default function Header({
  layoutMode,
  onToggleLayoutMode,
}: HeaderProps) {
  if (layoutMode === "modern") {
    return <ModernHeader onToggleLayoutMode={onToggleLayoutMode} />;
  }

  return <LegacyHeader onToggleLayoutMode={onToggleLayoutMode} />;
}

function ModernHeader({
  onToggleLayoutMode,
}: {
  onToggleLayoutMode: () => void;
}) {
  const session = useSession();

  return (
    <header className="sticky left-0 right-0 top-0 z-50 h-10 border-b border-border bg-white">
      <div className="relative mx-auto h-full w-full overflow-hidden md:w-[85vw]">
        <div className="relative z-10 flex h-full items-center justify-between px-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="flex items-center gap-1">
              <Image
                alt="Wadzzo"
                src="/images/logo.png"
                width={160}
                height={40}
                className="ml-1 h-7 w-auto object-contain md:h-8"
                priority
              />
              <span className="sr-only">Wadzzo</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <SiteAssetBalance layoutMode="modern" />
            {session.status === "authenticated" ? (
              <HeaderUserDropdown
                onToggleLayoutMode={onToggleLayoutMode}
                layoutMode="modern"
              />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function LegacyHeader({
  onToggleLayoutMode,
}: {
  onToggleLayoutMode: () => void;
}) {
  return (
    <header className="h-20 bg-base-100/20 px-2 py-4 md:px-6">
      <div className="flex w-full items-center justify-between xl:hidden">
        <div className="flex w-full items-center justify-around gap-2 ">
          <Hamburger
            layoutMode="legacy"
            onToggleLayoutMode={onToggleLayoutMode}
          />
          <Logo />
        </div>
        <SiteAssetBalance layoutMode="legacy" />
      </div>

      <div className="hidden items-center gap-4 xl:flex">
        <Image
          className="rounded-box"
          height={100}
          width={100}
          src={"/images/waddzo.gif"}
          alt={process.env.NEXT_PUBLIC_ASSET_CODE?.toString() ?? ""}
        />

        <Logo />
        <SiteAssetBalance layoutMode="legacy" />
      </div>
    </header>
  );
}

function HeaderUserDropdown({
  onToggleLayoutMode,
  layoutMode,
}: {
  onToggleLayoutMode: () => void;
  layoutMode: LayoutMode;
}) {
  const session = useSession();
  const user = session.data?.user;

  if (!user?.id) return null;

  const displayName =
    user.name?.trim() ?? `${user.id.slice(0, 6)}...${user.id.slice(-4)}`;
  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-7 gap-1.5 rounded-lg bg-muted px-2 text-xs font-medium text-foreground hover:bg-muted/90">
          <Avatar className="h-5 w-5 border border-black/10">
            <AvatarImage src={user.image ?? ""} alt={displayName} />
            <AvatarFallback className="text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 border border-black/10">
            <AvatarImage src={user.image ?? ""} alt={displayName} />
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email ?? user.id}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <UserCircle2 className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={onToggleLayoutMode}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {layoutMode === "modern" ? "Switch to Legacy" : "Switch to Modern"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-around gap-1 px-2">
          <Link href="/privacy" className="flex flex-col items-center gap-1 rounded-md p-1 text-xs transition-colors hover:bg-muted">
            <GlobeLock className="h-4 w-4" />
            <span className="text-[10px] font-medium">Privacy</span>
          </Link>
          <Link href="/support" className="flex flex-col items-center gap-1 rounded-md p-1 text-xs transition-colors hover:bg-muted">
            <Headphones className="h-4 w-4" />
            <span className="text-[10px] font-medium">Support</span>
          </Link>
          <Link href="/about" className="flex flex-col items-center gap-1 rounded-md p-1 text-xs transition-colors hover:bg-muted">
            <Info className="h-4 w-4" />
            <span className="text-[10px] font-medium">About</span>
          </Link>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
