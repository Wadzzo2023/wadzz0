import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "~/components/shadcn/ui/badge";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { Pin, Gem } from 'lucide-react';
import { AdminAsset } from "@prisma/client";
import { getCookie } from "cookies-next";

import { useModal } from "~/lib/state/play/use-modal-store";

export type AdminAssetWithTag = AdminAsset & {
  tags: {
    tagName: string;
  }[];
};

function Asset({ asset, isNFT = true, isPinned = false }: { asset: AdminAssetWithTag, isNFT?: boolean, isPinned?: boolean }) {
  const { logoUrl, logoBlueData, color, code } = asset;
  const { onOpen } = useModal();

  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "legacy" || cookieMode === "modern") {
      return cookieMode;
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "legacy" || storedMode === "modern") {
        return storedMode;
      }
    }
    return "modern";
  });

  if (layoutMode === "modern") {
    return (
      <div
        onClick={() => {
          onOpen("view admin asset", {
            adminAssetNtag: asset,
          });
        }}>
        <Card className="group h-full overflow-hidden rounded-[0.95rem] border border-[#ddd9d0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="relative aspect-[0.96] overflow-hidden rounded-t-[0.95rem] bg-[#d8c7bb]">
              <img
                alt="asset"
                src={logoUrl ?? "https://app.wadzzo.com/images/loading.png"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        onOpen("view admin asset", {
          adminAssetNtag: asset,
        });
      }}>
      <Card className="group relative overflow-hidden rounded-lg transition-all hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative aspect-square overflow-hidden">
            <img
              alt="asset"
              src={logoUrl ?? "https://app.wadzzo.com/images/loading.png"}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
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
    </div>
  );
}

export default Asset;
