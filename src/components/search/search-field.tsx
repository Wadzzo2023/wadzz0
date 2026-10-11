"use client";

import { useRouter } from "next/navigation";

import { SearchInput } from "~/ui/toolbar";

/** The search page's own box: keeps the query in the URL so results are shareable and indexable. */
export function SearchField({ value }: { value?: string }) {
  const router = useRouter();
  return (
    <SearchInput
      value={value}
      placeholder="Search items, creators, posts, bounties"
      onSearch={(q) => q.trim() !== (value ?? "") && router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search", { scroll: false })}
    />
  );
}
