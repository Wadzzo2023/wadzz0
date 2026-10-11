"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/**
 * Frame for screens ported from wadzzoAR (bounties). The app shell here is
 * the site shell (header + bottom nav), so this only centres the content.
 */
export function AppShell({ children, wide = false }: { children: ReactNode; tabs?: boolean; wide?: boolean }) {
  return <div className={cn("mx-auto flex w-full flex-col pb-4", wide ? "max-w-6xl" : "max-w-3xl")}>{children}</div>;
}

/** Screen header in wadzzoAR's style: eyebrow, title, optional trailing slot, optional back button. */
export function ScreenHeader({
  eyebrow,
  title,
  trailing,
  back = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
  back?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("relative z-20 flex items-end justify-between gap-3 px-5 pb-4 pt-6", className)}>
      {back && <BackButton className="mb-0.5 self-end" />}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="font-hud mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-ar-green">{eyebrow}</p>}
        <h1 className="font-hud truncate text-[26px] font-bold leading-none tracking-tight text-ar-text">{title}</h1>
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </header>
  );
}

export function BackButton({ className, fallback = "/" }: { className?: string; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      aria-label="Back"
      className={cn("ar-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ar-text", className)}
    >
      <ChevronLeft size={17} strokeWidth={2.4} />
    </button>
  );
}
