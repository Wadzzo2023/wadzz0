"use client";

import { usePathname, useRouter } from "next/navigation";

import { MEDIA_META, MEDIA_TYPES } from "~/components/media/media-meta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/shadcn/ui/select";
import { cn } from "~/lib/utils";
import type { ListingsInput } from "~/server/api/routers/market";
import { wordTab, wordTabList, wordTabOff, wordTabOn } from "~/ui/styles";
import { SearchInput, Toolbar } from "~/ui/toolbar";

const KINDS = [
  { id: "all", label: "All" },
  { id: "drops", label: "Creator drops" },
  { id: "resale", label: "Resale" },
] as const;

/** Filters are the URL, so every filtered view can be shared and indexed. */
export function MarketFilters({ current }: { current: ListingsInput }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/marketplace";
  const set = (patch: Record<string, string | undefined>) => {
    const next = { kind: current.kind, type: current.mediaType, sort: current.sort, q: current.search, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && !(k === "kind" && v === "all") && !(k === "sort" && v === "new")) sp.set(k, v);
    router.push(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className={wordTabList} role="tablist" aria-label="Listing kind">
        {KINDS.map((k) => {
          const active = (current.kind ?? "all") === k.id;
          return (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => set({ kind: k.id })}
              className={cn(wordTab, active ? wordTabOn : wordTabOff)}
            >
              {k.label}
            </button>
          );
        })}
      </div>
      <Toolbar>
        <SearchInput value={current.search} onSearch={(q) => q !== (current.search ?? "") && set({ q: q || undefined })} placeholder="Search items or creators" />
        <div className="flex gap-2">
          <Select value={current.mediaType ?? "any"} onValueChange={(v) => set({ type: v === "any" ? undefined : v })}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All types</SelectItem>
              {MEDIA_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {MEDIA_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={current.sort ?? "new"} onValueChange={(v) => set({ sort: v })}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Toolbar>
    </div>
  );
}
