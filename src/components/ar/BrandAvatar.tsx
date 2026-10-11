import { useEffect, useState } from "react";

import { cn } from "~/lib/utils";

/**
 * The stand-in when a brand's own artwork can't be fetched. Local, so it can
 * never be the thing that fails — `public/brand/wadzzo-mark.png` ships with the
 * app rather than being pulled from a CDN or a gateway.
 */
const FALLBACK_SRC = "/brand/wadzzo-mark.png";

/**
 * ── BrandAvatar ────────────────────────────────────────────────────────────
 *
 * A brand's image, with a fallback for when the URL simply doesn't resolve.
 *
 * This is not hypothetical. `Creator.profileUrl` is whatever the creator
 * uploaded through the main webapp, and the hosts differ per brand: most sit on
 * S3 or Pinata, but a couple point at the public `ipfs.io` gateway, which
 * rate-limits and then blocks outright (429, then 403 — including to our own
 * `/api/proxy-image`, so it isn't a CORS problem and can't be proxied around).
 * Those brands rendered as the browser's broken-image glyph on every surface
 * that shows them: the brands list, a brand's own page, and the creator face of
 * every card they issued.
 *
 * A swap can't recover the picture — only re-hosting the file can do that — but
 * it does mean a dead URL degrades to the Wadzzo mark instead of looking like
 * the app is broken.
 */
export function BrandAvatar({
  src,
  alt = "",
  className,
  loading = "lazy",
  onLoad,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  /**
   * Fires for the fallback too, not just the real image — `HoloCard` gates its
   * reveal on this, and a brand with a dead URL should still finish loading.
   */
  onLoad?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  // A list that recycles this component across brands (the rails, the brands
  // index) would otherwise carry one brand's failure onto the next one's image.
  useEffect(() => setFailed(false), [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed || !src ? FALLBACK_SRC : src}
      alt={alt}
      onError={() => setFailed(true)}
      onLoad={onLoad}
      loading={loading}
      decoding="async"
      className={cn("object-cover", className)}
    />
  );
}
