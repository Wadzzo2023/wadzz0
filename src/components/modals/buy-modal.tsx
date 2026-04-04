import { useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "~/utils/api";

import { ArrowLeft, X } from "lucide-react";
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

export default function BuyModal() {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { setCurrentTrack, currentTrack, setIsPlaying, setCurrentAudioPlayingId } = usePlayer();
  const isModalOpen = isOpen && type === "buy modal";
  const handleClose = () => {
    setCurrentTrack(null);
    setStep(1);
    onClose();
  };

  const { getAssetBalance, hasTrust, balances } = useUserStellarAcc()


  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };


  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery({
    id: data.Asset?.id,
  },
    {
      enabled: !!data.Asset
    }
  );


  const hasTrustonAsset = hasTrust(data.Asset?.asset.code ?? "", data.Asset?.asset.issuer ?? "");



  const { data: canBuyUser } =
    api.marketplace.market.userCanBuyThisMarketAsset.useQuery(
      data.Asset?.id ?? 0,
      {
        enabled: !!data.Asset
      }
    );


  if (!data.Asset || !data.Asset.asset)


    return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md border-0 bg-[#fbfaf6] p-6">
          <DialogClose className="absolute right-3 top-3 ">
            <X color="black" size={20} />
          </DialogClose>
          <div className="grid grid-cols-1">
            {/* Left Column - Product Image */}
            <Card className="border-0 bg-transparent shadow-none">
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

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] [&>button]:hidden">
          {step === 1 && (
            <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
              {/* Left Column - Product Image */}
              <Card className="max-h-[90vh] overflow-y-auto border-0 bg-[#fbfaf6] shadow-none md:w-[58%]">
                <CardContent className="space-y-6 p-5 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <h2 className="text-[1.1rem] font-semibold tracking-tight text-black md:text-[1.3rem]">
                        {data.Asset.asset.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
                        <span className="font-semibold text-black">{data.Asset.asset.code}</span>
                        <span className="hidden h-5 w-px bg-black/10 md:block" />
                        {data.Asset.placerId ? (
                          <span>
                            Owner <span className="font-semibold text-black">{addrShort(data.Asset.placerId, 5)}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <DialogClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-transparent text-black/55 transition hover:bg-black/5 hover:text-black">
                      <X className="h-4 w-4" />
                    </DialogClose>
                  </div>
                  {/* Image Container */}
                  <div className="relative aspect-[1.45] overflow-hidden rounded-[0.95rem] bg-[#d8c7bb]">
                    <img
                      src={getSafeImageUrl(data.Asset.asset.thumbnail)}
                      alt={data.Asset.asset.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-[2px] border-[#e5e7eb] bg-white px-1.5 py-0.5 font-mono text-xs font-medium tracking-[0.08em] text-black shadow-none hover:bg-white"
                      >
                        {data.Asset.asset.mediaType === "THREE_D"
                          ? "3D MODEL"
                          : data.Asset.asset.mediaType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-[2px] border-[#e5e7eb] bg-white px-1.5 py-0.5 font-mono text-xs font-medium tracking-[0.08em] text-black shadow-none hover:bg-white"
                      >
                        {data.Asset.asset.code}
                      </Badge>
                    </div>
                    <p className="min-h-[84px] text-sm leading-6 text-black/72">
                      {data.Asset.asset.description ?? "No description provided for this asset."}
                    </p>

                    <div className="space-y-1">
                      <span className="text-[0.95rem] font-medium tracking-tight text-black md:text-[1.05rem]">
                        {data.Asset.price} {PLATFORM_ASSET.code.toUpperCase()}
                      </span>
                      <p className="text-sm text-black/62">$ {data.Asset.priceUSD}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-black/72">
                      <span className="h-auto p-0 text-sm font-medium text-[#1677ff]">
                        Issuer: {addrShort(data.Asset.asset.issuer, 5)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black/82">
                      Available:{" "}
                      {copy.data === 0
                        ? "Sold out"
                        : copy.data === 1
                          ? "1 copy"
                          : copy.data !== undefined
                            ? `${copy.data} copies`
                            : "..."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-black/10 p-3">
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

                      className="h-12 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]"

                    >
                      Play
                    </Button>
                  ) : (
                    data.Asset.asset.mediaType === "VIDEO" && hasTrustonAsset && (
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

                        className="h-12 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]"

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
                        className="h-12 w-full rounded-xl border-0 bg-[#1f86ee] text-base font-semibold text-white shadow-none hover:bg-[#1877da]"
                      >
                        Buy
                      </Button>
                    )
                  )}

                  <p className="text-xs text-black/62">
                    Once purchased, this item will be placed on collection.
                  </p>
                </CardFooter>
              </Card>

              {/* Right Column - Bundle Info */}
              <div className="border-t border-black/8 bg-[#f1eee6] md:w-[42%] md:border-l md:border-t-0">
                {data.Asset.asset.mediaType === "IMAGE" ? (
                  hasTrustonAsset ? (
                    <>
                      <img
                        src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                        alt={data.Asset.asset.name}
                        className="h-full w-full object-cover md:min-h-[720px]"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                        }}
                      />
                    </>
                  ) : (<img
                    src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                    alt={data.Asset.asset.name}
                    className="h-full w-full object-cover blur-lg md:min-h-[720px]"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                    }}
                  />)
                ) : data.Asset.asset.mediaType === "VIDEO" ? (
                  hasTrustonAsset ? (
                    <div
                      style={{
                        backgroundImage: `url(${data.Asset.asset.thumbnail})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        height: "100%",
                        width: "100%",
                      }}
                      className={clsx(
                        "h-full w-full object-cover md:min-h-[720px]",
                      )}
                    >
                      <RightSidePlayer />
                    </div>
                  ) : (<img
                    src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                    alt={data.Asset.asset.name}
                    className="h-full w-full object-cover blur-lg md:min-h-[720px]"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                    }}
                  />)
                ) : data.Asset.asset.mediaType === "MUSIC" ? (
                  hasTrustonAsset ? (
                    <>
                      <div
                        style={{
                          backgroundImage: `url(${data.Asset.asset.thumbnail})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          height: "100%",
                          width: "100%",
                        }}
                        className={clsx(
                          "h-full w-full object-cover md:min-h-[720px]",
                        )}
                      >
                        <RightSidePlayer />
                      </div>
                    </>
                  ) : (<img
                    src={getSafeImageUrl(data.Asset.asset.mediaUrl)}
                    alt={data.Asset.asset.name}
                    className="h-full w-full object-cover blur-lg md:min-h-[720px]"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                    }}
                  />)
                ) : (
                  <>
                    <div
                      style={{
                        backgroundImage: `url(${data.Asset.asset.thumbnail})`,
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
                  </>
                )}
              </div>
            </div>
          )}
          {step === 2 && (
            <Card className="border-0 bg-[#fbfaf6]">
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
              <CardFooter className="p-4">
                {step === 2 && (
                  <Button onClick={handleBack} variant="outline" className="h-11 rounded-xl border-black/10 bg-white hover:bg-[#f7f7f7]">
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
