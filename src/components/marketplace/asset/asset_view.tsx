"use client";

import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { Badge } from "~/components/shadcn/ui/badge";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { Pin, Gem } from 'lucide-react';
import { cn } from "~/utils/utils";

interface AssetViewProps {
  code?: string;
  thumbnail: string | null;
  isNFT?: boolean;
  isPinned?: boolean;
  priceText?: string;
  subPriceText?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const FALLBACK_THUMBNAIL = "/images/logo.png";

function getSafeThumbnailSrc(thumbnail: string | null) {
  if (!thumbnail) return FALLBACK_THUMBNAIL;
  const lower = thumbnail.toLowerCase();
  const isLikelyMediaFile =
    lower.endsWith(".mp3") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".aac") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov");

  return isLikelyMediaFile ? FALLBACK_THUMBNAIL : thumbnail;
}

function AssetView({
  code,
  thumbnail,
  isNFT = true,
  isPinned = false,
  priceText,
  subPriceText,
  actionLabel,
  onAction,
}: AssetViewProps) {
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");
  const safeThumbnail = getSafeThumbnailSrc(thumbnail);

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern") {
      setLayoutMode("modern");
    } else {
      setLayoutMode("legacy");
    }
  }, []);

  const isModernLayout = layoutMode === "modern";

  if (isModernLayout) {
    return (
      <Card className="group h-full overflow-hidden rounded-[0.95rem] border border-[#ddd9d0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
        <CardContent className="flex h-full flex-col p-0">
          <div className="relative aspect-[0.96] overflow-hidden rounded-t-[0.95rem] bg-[#d8c7bb]">
            <img
              alt={code ?? "asset"}
              src={safeThumbnail}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMBNAIL;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
          </div>

          <div className="flex flex-1 flex-col gap-2 px-4 pb-3.5 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {isNFT ? (
                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-[0.64rem] font-medium text-black/60">
                  <Gem className="h-3 w-3" />
                  NFT
                </span>
              ) : null}
              {isPinned ? (
                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-[0.64rem] font-medium text-black/60">
                  <Pin className="h-3 w-3" />
                  PIN
                </span>
              ) : null}
            </div>
            <h3 className="line-clamp-1 text-[0.98rem] font-semibold leading-tight text-black/90">
              {code}
            </h3>
            {priceText ? (
              <div className="flex items-center gap-1 text-sm font-medium text-black/88">
                <span className="text-[#1f86ee]">{priceText}</span>
                {subPriceText ? <span className="text-black/55">{subPriceText}</span> : null}
              </div>
            ) : null}
          </div>
          {actionLabel ? (
            <div className="relative z-20 mt-2 md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:translate-y-full md:opacity-0 md:transition-all md:duration-300 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100">
              <button
                type="button"
                className="h-11 w-full rounded-none border-0 bg-[#1f86ee] px-4 text-sm font-semibold text-white shadow-none hover:bg-[#1877da]"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.();
                }}
              >
                {actionLabel}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden rounded-lg transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <img
            alt={code ?? "asset"}
            src={safeThumbnail}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMBNAIL;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
          <div className={cn("absolute bottom-0 left-0 right-0 p-4 text-white")}>
            <p className="mb-2 truncate text-lg font-bold">{code}</p>
            <div className="flex gap-2">

              {isPinned ? (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  <Pin className="mr-1 h-3 w-3" />
                  PIN
                </Badge>
              ) : isNFT ?
                (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    <Gem className="mr-1 h-3 w-3" />
                    NFT
                  </Badge>
                ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AssetView;
