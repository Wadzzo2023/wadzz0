"use client";

import type { LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Input } from "~/components/shadcn/ui/input";
import { cn } from "~/lib/utils";

/** The row above a list: search on the left, filters and actions after it. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>{children}</div>;
}

/** Search box with a clear button. `onSearch` fires after typing pauses. */
export function SearchInput({
  value,
  onSearch,
  placeholder = "Search",
  delay = 300,
  className,
}: {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => {
    const t = setTimeout(() => onSearch(text.trim()), delay);
    return () => clearTimeout(t);
  }, [text, delay, onSearch]);

  return (
    <div className={cn("relative min-w-0 flex-1 sm:w-72 sm:flex-none", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setText("")}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** One-of filter as pills (All · Pending · Approved…), with optional counts. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: LucideIcon; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary",
              on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-line-bright hover:text-foreground",
            )}
          >
            {o.icon && <o.icon className="size-3.5" />}
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", on ? "bg-primary-foreground/20" : "bg-muted")}>{o.count.toLocaleString()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
