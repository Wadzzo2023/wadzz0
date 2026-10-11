import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { addrShort } from "~/utils/utils";

/** First letter for an avatar without a picture. */
function initial(text: string | null | undefined) {
  return (text?.trim()?.[0] ?? "?").toUpperCase();
}

/** A round avatar — the picture, or the first letter on a tinted circle. */
export function Avatar({ src, name, className }: { src?: string | null; name?: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={cn("size-9 shrink-0 rounded-full bg-muted object-cover", className)} />
  ) : (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary", className)} aria-hidden>
      {initial(name)}
    </span>
  );
}

/**
 * Who: avatar, name, and a quieter second line (email, wallet, role…). Falls
 * back to a shortened wallet when there's no name.
 */
export function Person({
  name,
  image,
  sub,
  id,
  size = "md",
  className,
}: {
  name?: string | null;
  image?: string | null;
  sub?: ReactNode;
  /** Wallet / account id, shown shortened when there's no name. */
  id?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  // An empty name counts as no name.
  const title = (name?.trim() ? name.trim() : undefined) ?? (id ? addrShort(id, 5) : "Unknown");
  const avatar = size === "sm" ? "size-7 text-xs" : size === "lg" ? "size-12 text-base" : "size-9";
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar src={image} name={title} className={avatar} />
      <div className="min-w-0">
        <p className={cn("truncate font-medium", size === "lg" ? "text-base" : "text-sm")}>{title}</p>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
