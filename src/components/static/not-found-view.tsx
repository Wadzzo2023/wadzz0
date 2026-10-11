import { Compass, Home, Search } from "lucide-react";
import Link from "next/link";

/** The 404 screen, inside the site's header and nav. */
export function NotFoundView() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-foreground/[0.06] p-8 text-center">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.22),transparent_60%),radial-gradient(circle_at_80%_90%,hsl(190_90%_50%/0.14),transparent_60%)]" />
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_30px_-8px_hsl(var(--primary)/0.8)]">
          <Compass className="size-7" />
        </span>
        <p className="font-hud text-6xl font-bold text-gradient">404</p>
        <h1 className="mt-2 font-hud text-xl font-bold">This page wandered off</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">The link may be old, or the item, post or brand may have moved.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]">
            <Home className="size-4" /> Home
          </Link>
          <Link href="/search" className="glass inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold">
            <Search className="size-4" /> Search
          </Link>
        </div>
      </div>
    </div>
  );
}
