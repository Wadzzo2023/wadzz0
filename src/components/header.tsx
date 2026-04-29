"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeftRight,
  ChevronDown,
  Copy,
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
import toast from "react-hot-toast";
import { useState } from "react";

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

  const [isCopying, setIsCopying] = useState(false);
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
      <DropdownMenuContent align="end" className="w-64 border border-border bg-popover shadow-lg">
        <div className="flex items-center gap-3 rounded-lg px-3 py-3 bg-secondary/30 mx-2 mt-2 border border-border">
          <Avatar className="h-10 w-10 border-2 border-primary/50">
            <AvatarImage src={user.image ?? ""} alt={displayName} />
            <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <div className="flex items-center gap-1">
              <p className="truncate text-xs text-muted-foreground font-mono">
                {user.id.slice(0, 12)}...
              </p>
              <button
                onClick={async () => {
                  setIsCopying(true);
                  await navigator.clipboard.writeText(user.id);
                  toast.success("User ID copied to clipboard");
                  setTimeout(() => setIsCopying(false), 2000);
                }}
                disabled={isCopying}
                className="inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors duration-150 disabled:opacity-50"
                title="Copy user ID"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer mx-2 px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors duration-150">
            <UserCircle2 className="mr-2 h-4 w-4 text-primary" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer mx-2 px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors duration-150"
          onClick={onToggleLayoutMode}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4 text-primary" />
          {layoutMode === "modern" ? "Switch to Legacy" : "Switch to Modern"}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <div className="flex items-center justify-around gap-2 px-3 py-3">
          <Link href="/privacy" className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-xs transition-all duration-150 hover:bg-muted group flex-1">
            <GlobeLock className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Privacy</span>
          </Link>
          <Link href="/support" className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-xs transition-all duration-150 hover:bg-muted group flex-1">
            <Headphones className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Support</span>
          </Link>
          <Link href="/about" className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-xs transition-all duration-150 hover:bg-muted group flex-1">
            <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">About</span>
          </Link>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          className="cursor-pointer mx-2 px-3 py-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors duration-150 font-medium"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
