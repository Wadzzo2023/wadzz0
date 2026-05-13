import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { api } from "~/utils/api";

const LAYOUT_MODE_COOKIE = "wadzzo-layout-mode";

import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "~/components/shadcn/ui/dialog";

import { z } from "zod";
import { addrShort } from "~/utils/utils";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import { useModal } from "~/lib/state/play/use-modal-store";
import { SparkleEffect } from "./modal-action-button";
import { X } from "lucide-react";

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

const FALLBACK_PREVIEW_IMAGE = "/images/logo.png";

const getSafeImageUrl = (url?: string | null) => {
  if (!url) return FALLBACK_PREVIEW_IMAGE;
  const cleanUrl = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  const isImage =
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.endsWith(".svg") ||
    cleanUrl.endsWith(".avif");
  return isImage ? url : FALLBACK_PREVIEW_IMAGE;
};

export default function ViewAdminAsset() {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();

  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie(LAYOUT_MODE_COOKIE);
    if (cookieMode === "modern") {
      return "modern";
    }
    if (cookieMode === "legacy") {
      return "legacy";
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "modern") {
        return "modern";
      }
      if (storedMode === "legacy") {
        return "legacy";
      }
    }
    return "legacy";
  });

  const isModalOpen = isOpen && type === "view admin asset";
  const handleClose = () => {
    onClose();
  };

  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery(
    {
      id: data.adminAssetNtag?.id,
    },
    {
      enabled: !!data.adminAssetNtag?.id,
    },
  );

  const isLegacy = layoutMode === "legacy";

  if (data.adminAssetNtag)
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          {isLegacy ? (
            <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:rounded-full [&>button]:border [&>button]:border-black [&>button]:bg-white [&>button]:text-black">
              <div className="grid grid-cols-2 md:grid-cols-7">
                <Card className="max-h-[800px] overflow-y-auto bg-[#1e1f22] md:col-span-3">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-[#1e1f22]">
                      <SparkleEffect />
                      <img
                        src={data.adminAssetNtag.logoUrl}
                        alt={data.adminAssetNtag.code}
                        width={1000}
                        height={1000}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <h2 className="text-xl font-bold text-white">
                        {data.adminAssetNtag.code}
                      </h2>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="h-auto p-0 text-xs text-[#00a8fc]">
                          {addrShort(data.adminAssetNtag.adminId, 5)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-1 p-2">
                    <Link
                      className="w-full"
                      href={data.adminAssetNtag.StellarTerm ?? ""}
                    >
                      <Button className="w-full" variant="outline">
                        View on StellarTerm
                      </Button>
                    </Link>
                    <Link
                      className="w-full"
                      href={data.adminAssetNtag.Litemint ?? ""}
                    >
                      <Button className="w-full" variant="outline">
                        View on Litemint
                      </Button>
                    </Link>
                    <Link
                      className="w-full"
                      href={data.adminAssetNtag.StellarX ?? ""}
                    >
                      <Button className="w-full" variant="outline">
                        View on StellarX
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                <div className="rounded-sm bg-gray-300 p-1 md:col-span-4">
                  <img
                    src={data.adminAssetNtag.logoUrl}
                    alt={data.adminAssetNtag.code}
                    width={1000}
                    height={1000}
                    className={clsx(
                      "h-full max-h-[800px] w-full overflow-y-auto object-cover",
                    )}
                  />
                </div>
              </div>
            </DialogContent>
          ) : (
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] [&>button]:hidden">
              <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
                <Card className="max-h-[90vh] overflow-y-auto border-0 bg-[#fbfaf6] shadow-none md:w-[58%]">
                  <CardContent className="space-y-6 p-5 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <h2 className="text-[1.1rem] font-semibold tracking-tight text-black md:text-[1.3rem]">
                          {data.adminAssetNtag.code}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
                          <span className="font-semibold text-black">
                            {addrShort(data.adminAssetNtag.adminId, 5)}
                          </span>
                        </div>
                      </div>
                      <DialogClose className="border-black/12 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-transparent text-black/55 transition hover:bg-black/5 hover:text-black">
                        <X className="h-4 w-4" />
                      </DialogClose>
                    </div>
                    <div className="relative aspect-[1.45] overflow-hidden rounded-[0.95rem] bg-[#d8c7bb]">
                      <img
                        src={getSafeImageUrl(data.adminAssetNtag.logoUrl)}
                        alt={data.adminAssetNtag.code}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2 border-t border-black/10 p-3">
                    <Link
                      className="w-full"
                      href={data.adminAssetNtag.StellarTerm ?? ""}
                    >
                      <Button className="h-12 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]">
                        View on StellarTerm
                      </Button>
                    </Link>
                    <Link
                      className="w-full"
                      href={data.adminAssetNtag.Litemint ?? ""}
                    >
                      <Button className="h-12 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]">
                        View on Litemint
                      </Button>
                    </Link>
                    <Link
                      className="w-full"
                      href={data.adminAssetNtag.StellarX ?? ""}
                    >
                      <Button className="h-12 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]">
                        View on StellarX
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                <div className="border-black/8 border-t bg-[#f1eee6] md:w-[42%] md:border-l md:border-t-0">
                  <img
                    src={getSafeImageUrl(data.adminAssetNtag.logoUrl)}
                    alt={data.adminAssetNtag.code}
                    className="h-full w-full object-cover md:min-h-[720px]"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                    }}
                  />
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </>
    );
}
