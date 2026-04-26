import { useSession } from "next-auth/react";
import { useState } from "react";
import { getCookie } from "cookies-next";
import { api } from "~/utils/api";

const LAYOUT_MODE_COOKIE = "wadzzo-layout-mode";

import { ArrowLeft, Copy, X } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "~/components/shadcn/ui/dialog";

import { Badge } from "~/components/shadcn/ui/badge";

import { PLATFORM_ASSET } from "~/lib/stellar/constant";

import { z } from "zod";
import { addrShort } from "~/utils/utils";

import clsx from "clsx";
import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import { SongItemType, useModal } from "~/lib/state/play/use-modal-store";

import { useRouter } from "next/router";
import BuyItem from "../BuyItem";
import ShowModel from "../ThreeDModel";
import {
  DeleteAssetByAdmin,
  DisableFromMarketButton,
  SparkleEffect,
} from "./modal-action-button";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { usePlayer } from "../context/PlayerContext";
import { RightSidePlayer } from "../RightSidePlayer";

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

function DetailRow({
  label,
  value,
  valueClassName = "text-black",
  trailing,
}: {
  label: string;
  value: string | React.ReactNode;
  valueClassName?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-black/55">{label}</span>
      <div className="flex items-center gap-2">
        <span className={clsx("text-sm font-medium", valueClassName)}>{value}</span>
        {trailing}
      </div>
    </div>
  );
}

export default function BuyModal() {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const {
    setCurrentTrack,
    currentTrack,
    setIsPlaying,
    setCurrentAudioPlayingId,
  } = usePlayer();
  const isModalOpen = isOpen && type === "buy modal";
  const handleClose = () => {
    setCurrentTrack(null);
    setStep(1);
    onClose();
  };

  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie(LAYOUT_MODE_COOKIE);
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
  const isLegacy = layoutMode === "legacy";

  const { getAssetBalance, hasTrust, balances } = useUserStellarAcc();

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery(
    {
      id: data.Asset?.id,
    },
    {
      enabled: !!data.Asset,
    },
  );

  const hasTrustonAsset = hasTrust(
    data.Asset?.asset.code ?? "",
    data.Asset?.asset.issuer ?? "",
  );

  const { data: canBuyUser } =
    api.marketplace.market.userCanBuyThisMarketAsset.useQuery(
      data.Asset?.id ?? 0,
      {
        enabled: !!data.Asset,
      },
    );

  if (!data.Asset || !data.Asset.asset) {
    if (isLegacy) {
      return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-2xl overflow-hidden p-1   ">
            <DialogClose className="absolute right-3 top-3 ">
              <X color="white" size={24} />
            </DialogClose>
            <div className="grid grid-cols-1">
              <Card className="  bg-[#1e1f22] ">
                <CardContent className="flex max-h-[600px] min-h-[600px] items-center justify-center">
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      className="h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
            <div className="border-b border-black/8 bg-[#f1eee6] md:w-[42%] md:border-b-0 md:border-r">
              <div className="relative h-[320px] overflow-hidden bg-[#d8c7bb] md:h-full md:min-h-[720px]">
                <div role="status" className="flex h-full items-center justify-center">
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col overflow-hidden bg-[#fbfaf6] md:w-[58%]">
              <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <h1 className="text-[1.65rem] font-semibold tracking-tight text-black md:text-[2rem]">
                      Loading...
                    </h1>
                  </div>
                  <DialogClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-transparent text-black/55 transition hover:bg-black/5 hover:text-black">
                    <X className="h-4 w-4" />
                  </DialogClose>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLegacy) {
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:rounded-full [&>button]:border [&>button]:border-black [&>button]:bg-white [&>button]:text-black">
            {step === 1 && (
              <div className="grid grid-cols-2 md:grid-cols-7">
                <Card className=" max-h-[800px]  overflow-y-auto  bg-[#1e1f22] md:col-span-3">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-[#1e1f22]">
                      <SparkleEffect />
                      <img
                        src={getSafeImageUrl(data.Asset.asset.thumbnail)}
                        alt={data.Asset.asset.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <h2 className="text-xl font-bold text-white">
                        NAME: {data.Asset.asset.name}
                      </h2>

                      <p className="max-h-[100px] min-h-[100px] overflow-y-auto text-sm text-gray-400">
                        DESCRIPTION: {data.Asset.asset.description}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          PRICE: {data.Asset.price} {PLATFORM_ASSET.code}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-none bg-white text-[#3ba55c]"
                        >
                          $ {data.Asset.priceUSD}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="h-auto p-0 text-xs text-[#00a8fc]">
                          ISSUER ID: {addrShort(data.Asset.asset.issuer, 5)}
                        </span>
                        <Badge variant="destructive" className=" rounded-lg">
                          {data.Asset.asset.code}
                        </Badge>
                      </div>
                      {data.Asset.placerId && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="h-auto p-0 text-xs text-[#00a8fc]">
                            PLACER ID: {addrShort(data.Asset.placerId, 5)}
                          </span>
                        </div>
                      )}

                      <p className="font-semibold text-white">
                        <span className="">Available:</span>{" "}
                        {copy.data === 0
                          ? "Sold out"
                          : copy.data === 1
                            ? "1 copy"
                            : copy.data !== undefined
                              ? `${copy.data} copies`
                              : "..."}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="h-auto p-0 text-xs text-[#00a8fc]">
                          Media Type:
                        </span>
                        <Badge variant="destructive" className=" rounded-lg">
                          {data.Asset.asset.mediaType === "THREE_D"
                            ? "3D Model"
                            : data.Asset.asset.mediaType}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-1 p-2">
                    {data.Asset.asset.mediaType === "MUSIC" && hasTrustonAsset ? (
                      <Button
                        onClick={() => {
                          setCurrentAudioPlayingId(data.Asset?.id ?? 0);
                          setIsPlaying(true);
                          setCurrentTrack({
                            asset: data.Asset?.asset,
                            albumId: 2,
                            artist: " ",
                            assetId: 1,
                            createdAt: new Date(),
                            price: 15,
                            priceUSD: 50,
                            id: 1,
                          } as SongItemType);
                        }}
                        className="w-full bg-[#39BD2B] text-white hover:bg-sky-700 "
                      >
                        Play
                      </Button>
                    ) : (
                      data.Asset.asset.mediaType === "VIDEO" &&
                      hasTrustonAsset && (
                        <Button
                          onClick={() => {
                            setCurrentTrack(null);
                            setCurrentTrack({
                              asset: data.Asset?.asset,
                              albumId: 2,
                              artist: " ",
                              assetId: 1,
                              createdAt: new Date(),
                              price: 15,
                              priceUSD: 50,
                              id: 1,
                            } as SongItemType);
                          }}
                          className="w-full bg-[#39BD2B] text-white hover:bg-sky-700"
                        >
                          Play
                        </Button>
                      )
                    )}
                    {session.status === "authenticated" &&
                      data.Asset.placerId === session.data.user.id ? (
                      <>
                        <DisableFromMarketButton
                          code={data.Asset.asset.code}
                          issuer={data.Asset.asset.issuer}
                        />
                      </>
                    ) : (
                      canBuyUser &&
                      copy.data &&
                      copy.data > 0 && (
                        <Button
                          onClick={handleNext}
                          className="w-full"
                          variant={"outline"}
                        >
                          Buy
                        </Button>
                      )
                    )}

                    <p className="text-xs text-gray-400">
                      Once purchased, this item will be placed on collection.
                    </p>
                  </CardFooter>
                </Card>

                <div className=" rounded-sm bg-gray-300 p-1   md:col-span-4 ">
                  {data.Asset.asset.mediaType === "IMAGE" ? (
                    hasTrustonAsset ? (
                      <img
                        src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                        alt={data.Asset.asset.name}
                        className="h-full max-h-[800px] w-full overflow-y-auto object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    ) : (
                      <img
                        src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                        alt={data.Asset.asset.name}
                        className="h-full max-h-[800px] w-full overflow-y-auto object-cover blur-lg"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    )
                  ) : data.Asset.asset.mediaType === "VIDEO" ? (
                    hasTrustonAsset ? (
                      <div
                        style={{
                          backgroundImage: `url(${getSafeImageUrl(data.Asset.asset.thumbnail)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          height: "100%",
                          width: "100%",
                        }}
                        className={clsx(
                          "h-full max-h-[800px] w-full overflow-y-auto object-cover",
                        )}
                      >
                        <RightSidePlayer />
                      </div>
                    ) : (
                      <img
                        src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                        alt={data.Asset.asset.name}
                        className="h-full max-h-[800px] w-full overflow-y-auto object-cover blur-lg"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    )
                  ) : data.Asset.asset.mediaType === "MUSIC" ? (
                    hasTrustonAsset ? (
                      <div
                        style={{
                          backgroundImage: `url(${getSafeImageUrl(data.Asset.asset.thumbnail)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          height: "100%",
                          width: "100%",
                        }}
                        className={clsx(
                          "h-full max-h-[800px] w-full overflow-y-auto object-cover",
                        )}
                      >
                        <RightSidePlayer />
                      </div>
                    ) : (
                      <img
                        src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                        alt={data.Asset.asset.name}
                        className="h-full max-h-[800px] w-full overflow-y-auto object-cover blur-lg"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    )
                  ) : (
                    <div
                      style={{
                        backgroundImage: `url(${getSafeImageUrl(data.Asset.asset.thumbnail)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        height: "100%",
                        width: "100%",
                      }}
                    >
                      <ShowModel
                        url={data.Asset.asset.mediaUrl}
                        blur={hasTrustonAsset ? false : true}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {step === 2 && (
              <Card>
                <CardContent className="p-0">
                  <BuyItem
                    marketItemId={data.Asset.id}
                    priceUSD={data.Asset.priceUSD}
                    item={data.Asset.asset}
                    price={data.Asset.price}
                    placerId={data.Asset.placerId}
                    setClose={handleClose}
                  />
                </CardContent>
                <CardFooter className="p-2">
                  {step === 2 && (
                    <Button onClick={handleBack} variant="secondary" className="">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          {
            step == 1 && (
              <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
                <div className="border-b border-black/8 bg-[#f1eee6] md:w-[42%] md:border-b-0 md:border-r">
                  <div className="relative h-[320px] overflow-hidden bg-[#d8c7bb] md:h-full md:min-h-[720px]">
                    <img
                      src={getSafeImageUrl(data.Asset.asset.thumbnail)}
                      alt={data.Asset.asset.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                      }}
                    />
                  </div>
                </div>

                <div className="flex w-full flex-col overflow-hidden bg-[#fbfaf6] md:w-[58%]">
                  <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <h1 className="text-[1.65rem] font-semibold tracking-tight text-black md:text-[2rem]">
                          {data.Asset.asset.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
                          <span className="font-semibold text-black">{data.Asset.asset.code}</span>
                        </div>
                      </div>
                      <DialogClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-transparent text-black/55 transition hover:bg-black/5 hover:text-black">
                        <X className="h-4 w-4" />
                      </DialogClose>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {data.Asset.asset.mediaType ? (
                        <Badge
                          variant="outline"
                          className="rounded-[2px] border-[#e5e7eb] bg-white px-1.5 py-0.5 font-mono text-xs font-medium tracking-[0.08em] text-black shadow-none hover:bg-white"
                        >
                          {data.Asset.asset.mediaType}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="border-b border-black/10 pb-0">
                      <h3 className="inline-block border-b-2 border-black pb-3 text-sm font-medium tracking-tight text-black">
                        Asset Details
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <DetailRow
                        label="Issuer ID"
                        value={addrShort(data.Asset.asset.issuer, 5)}
                        valueClassName="text-[#1677ff]"
                        trailing={
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(data.Asset!.asset.issuer)}
                            className="inline-flex items-center justify-center text-black/55 transition hover:text-black"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        }
                      />
                      <DetailRow
                        label="Price"
                        value={`${data.Asset.price} ${PLATFORM_ASSET.code}`}
                        valueClassName="text-black"
                      />
                      <DetailRow
                        label="Price USD"
                        value={`$${data.Asset.priceUSD}`}
                        valueClassName="text-[#1677ff]"
                      />
                      <DetailRow
                        label="Available"
                        value={
                          copy.data === 0
                            ? "Sold out"
                            : copy.data === 1
                              ? "1 copy"
                              : copy.data !== undefined
                                ? `${copy.data} copies`
                                : "..."
                        }
                      />
                    </div>

                    <div className="border-b border-black/10 pb-0">
                      <h3 className="inline-block border-b-2 border-black pb-3 text-sm font-medium tracking-tight text-black">
                        Description
                      </h3>
                    </div>

                    <p className="text-sm text-black/70">{data.Asset.asset.description}</p>
                  </div>

                  <div className="border-t border-black/8 bg-white p-4 md:p-6">
                    <div className="flex flex-col gap-3">
                      {data.Asset.asset.mediaType === "MUSIC" && hasTrustonAsset ? (
                        <Button
                          onClick={() => {
                            setCurrentAudioPlayingId(data.Asset?.id ?? 0);
                            setIsPlaying(true);
                            setCurrentTrack({
                              asset: data.Asset?.asset,
                              albumId: 2,
                              artist: " ",
                              assetId: 1,
                              createdAt: new Date(),
                              price: 15,
                              priceUSD: 50,
                              id: 1,
                            } as SongItemType);
                          }}
                          className="w-full bg-[#39BD2B] text-white hover:bg-sky-700"
                        >
                          Play
                        </Button>
                      ) : data.Asset.asset.mediaType === "VIDEO" && hasTrustonAsset ? (
                        <Button
                          onClick={() => {
                            setCurrentTrack(null);
                            setCurrentTrack({
                              asset: data.Asset?.asset,
                              albumId: 2,
                              artist: " ",
                              assetId: 1,
                              createdAt: new Date(),
                              price: 15,
                              priceUSD: 50,
                              id: 1,
                            } as SongItemType);
                          }}
                          className="w-full bg-[#39BD2B] text-white hover:bg-sky-700"
                        >
                          Play
                        </Button>
                      ) : null}
                      {session.status === "authenticated" &&
                        data.Asset.placerId === session.data.user.id ? (
                        <DisableFromMarketButton
                          code={data.Asset.asset.code}
                          issuer={data.Asset.asset.issuer}
                        />
                      ) : (
                        canBuyUser &&
                        copy.data &&
                        copy.data > 0 && (
                          <Button
                            onClick={handleNext}
                            className="w-full"
                            variant={"default"}
                          >
                            Buy Now
                          </Button>
                        )
                      )}
                      <p className="text-center text-xs text-black/55">
                        Once purchased, this item will be placed in your collection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          {step === 2 && (
            <Card>
              <CardContent className="p-0">
                <BuyItem
                  marketItemId={data.Asset.id}
                  priceUSD={data.Asset.priceUSD}
                  item={data.Asset.asset}
                  price={data.Asset.price}
                  placerId={data.Asset.placerId}
                  setClose={handleClose}
                />
              </CardContent>
              <CardFooter className="p-2">
                {step === 2 && (
                  <Button onClick={handleBack} variant="secondary" className="">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
