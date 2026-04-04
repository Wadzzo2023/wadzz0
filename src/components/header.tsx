"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowLeftRight,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserCircle2,
} from "lucide-react";

import { SiteAssetBalance } from "./marketplace/recharge/site_asset_bal";
import { Button } from "~/components/shadcn/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/shadcn/ui/sheet";
import LeftBar from "./left-sidebar";
import Logo from "./logo";
import { useDrawerOpenStore } from "~/lib/state/fan/drawer_open";

export type LayoutMode = "modern" | "legacy";

type HeaderProps = {
  layoutMode: LayoutMode;
  onToggleLayoutMode: () => void;
};

export default function Header({ layoutMode, onToggleLayoutMode }: HeaderProps) {
  if (layoutMode === "modern") {
    return <ModernHeader onToggleLayoutMode={onToggleLayoutMode} />;
  }

  return <LegacyHeader onToggleLayoutMode={onToggleLayoutMode} />;
}

function ModernHeader({ onToggleLayoutMode }: { onToggleLayoutMode: () => void }) {
  const session = useSession();
  const drawer = useDrawerOpenStore();

  return (
    <header className="sticky left-0 right-0 top-0 z-50 h-10 border-b border-border bg-white shadow-sm">
      <div className="relative mx-auto h-full w-full overflow-hidden md:w-[85vw]">
        <div className="relative z-10 flex h-full items-center justify-between px-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Sheet open={drawer.isOpen} onOpenChange={drawer.setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-lg border-border bg-muted md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 !px-0 py-8">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <LeftBar className="bg-base-100" />
              </SheetContent>
            </Sheet>

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
            <SiteAssetBalance />
            {session.status === "authenticated" ? (
              <HeaderUserDropdown onToggleLayoutMode={onToggleLayoutMode} layoutMode="modern" />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function LegacyHeader({ onToggleLayoutMode }: { onToggleLayoutMode: () => void }) {
  const session = useSession();

  return (
    <header className="sticky top-0 z-50 h-20 border-b border-border bg-white px-2 py-4 md:px-6">
      <div className="flex h-full w-full items-center justify-between xl:hidden">
        <div className="flex w-full items-center justify-around gap-2">
          <MobileLegacyMenu />
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <SiteAssetBalance />
          {session.status === "authenticated" ? (
            <HeaderUserDropdown onToggleLayoutMode={onToggleLayoutMode} layoutMode="legacy" />
          ) : null}
        </div>
      </div>

      <div className="hidden h-full w-full items-center justify-between gap-4 xl:flex">
        <div className="flex items-center gap-3">
          <Image
            className="rounded-box"
            height={100}
            width={100}
            src="/images/waddzo.gif"
            alt={process.env.NEXT_PUBLIC_ASSET_CODE?.toString() ?? ""}
          />
          <Logo />
        </div>

        <div className="flex items-center gap-2">
          <SiteAssetBalance />
          {session.status === "authenticated" ? (
            <HeaderUserDropdown onToggleLayoutMode={onToggleLayoutMode} layoutMode="legacy" />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MobileLegacyMenu() {
  const drawer = useDrawerOpenStore();

  return (
    <Sheet open={drawer.isOpen} onOpenChange={drawer.setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-lg border-border bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 !px-0 py-8">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <LeftBar className="bg-base-100" />
      </SheetContent>
    </Sheet>
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

  const displayName = user.name?.trim() ?? `${user.id.slice(0, 6)}...${user.id.slice(-4)}`;
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
            <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 border border-black/10">
            <AvatarImage src={user.image ?? ""} alt={displayName} />
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email ?? user.id}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <UserCircle2 className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer" onClick={onToggleLayoutMode}>
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {layoutMode === "modern" ? "Switch to Legacy" : "Switch to Modern"}
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

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
