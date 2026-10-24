"use client";

import { ArrowRight, CornerDownLeft, Newspaper, Search, Store, Target, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/shadcn/ui/dialog";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

/* One palette for the whole app: the sidebar search field and the mobile search tab both open it, and so does ⌘K / Ctrl+K. */
const EVENT = "wadzzo-search";
let open = false;
const setOpen = (next: boolean) => {
  open = next;
  window.dispatchEvent(new Event(EVENT));
};
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};

export const openSearch = () => setOpen(true);

const QUICK = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/bounties", label: "Bounties", icon: Target },
  { href: "/feed", label: "Feed", icon: Newspaper },
];

export function SearchDialog() {
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  const router = useRouter();
  const [q, setQ] = useState("");
  const term = useDeferredValue(q.trim());
  const results = api.search.all.useQuery({ q: term }, { enabled: isOpen && term.length >= 2, staleTime: 30_000, placeholderData: (prev) => prev });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (term.length < 2) return;
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const r = term.length >= 2 ? results.data : undefined;
  const empty = r && !r.items.length && !r.creators.length && !r.posts.length && !r.bounties.length;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="glass top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Find items, creators, posts and bounties</DialogDescription>
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-foreground/[0.07] px-4">
          <Search className="size-5 shrink-0 text-primary" />
          <input
            autoFocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, creators, posts, bounties"
            aria-label="Search"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="hidden rounded-md border border-foreground/10 px-1.5 py-0.5 font-hud text-[10px] text-muted-foreground sm:block">ESC</kbd>
        </form>

        <div className="max-h-[60dvh] overflow-y-auto p-2">
          {!r ? (
            <div className="p-2">
              <p className="label-caps px-2 pb-2">Jump to</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="group flex items-center gap-3 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <l.icon className="size-4" />
                    </span>
                    {l.label}
                    <ArrowRight className="ml-auto size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          ) : empty ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing found for “{term}”.</p>
          ) : (
            <AnimatePresence initial={false}>
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                <Group title="Items" show={r.items.length > 0}>
                  {r.items.map((i) => (
                    <Hit key={i.id} href={`/item/${i.id}`} onClick={close} image={i.thumbnail} title={i.name} hint={i.creator?.name ?? i.code} />
                  ))}
                </Group>
                <Group title="Creators" show={r.creators.length > 0}>
                  {r.creators.map((c) => (
                    <Hit key={c.id} href={`/creator/${c.id}`} onClick={close} image={c.profileUrl} title={c.name} hint="Creator" round />
                  ))}
                </Group>
                <Group title="Bounties" show={r.bounties.length > 0}>
                  {r.bounties.map((b) => (
                    <Hit key={b.id} href={`/bounties/${b.id}`} onClick={close} image={b.imageUrls[0]} title={b.title} hint="Bounty" />
                  ))}
                </Group>
                <Group title="Posts" show={r.posts.length > 0}>
                  {r.posts.map((p) => (
                    <Hit key={p.id} href={`/posts/${p.id}`} onClick={close} title={p.heading} hint={p.creator.name} />
                  ))}
                </Group>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {term.length >= 2 && (
          <button
            type="button"
            onClick={submit}
            className="flex w-full items-center justify-between border-t border-foreground/[0.07] px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
          >
            <span>
              See all results for <span className="font-semibold text-foreground">“{term}”</span>
            </span>
            <CornerDownLeft className="size-4" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Group({ title, show, children }: { title: string; show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <div className="pb-1">
      <p className="label-caps px-3 pb-1 pt-2">{title}</p>
      {children}
    </div>
  );
}

function Hit({ href, onClick, image, title, hint, round }: { href: string; onClick: () => void; image?: string | null; title: string; hint?: string | null; round?: boolean }) {
  return (
    <Link href={href} onClick={onClick} className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-foreground/[0.05]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className={cn("size-10 shrink-0 bg-surface-2 object-cover", round ? "rounded-full" : "rounded-lg")} />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
          <Newspaper className="size-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <ArrowRight className="size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
