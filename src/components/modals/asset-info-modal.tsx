import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

import { X } from 'lucide-react';
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "~/components/shadcn/ui/dialog";

import { Badge } from "~/components/shadcn/ui/badge";
import {
  useCreatorStorageAcc,
  useUserStellarAcc,
} from "~/lib/state/wallete/stellar-balances";

import { z } from "zod";
import { addrShort } from "~/utils/utils";

import clsx from "clsx";
import { useRouter } from "next/router";
import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import { SongItemType, useModal } from "~/lib/state/play/use-modal-store";
import { usePlayer } from "../context/PlayerContext";
import { RightSidePlayer } from "../RightSidePlayer";
import ShowModel from "../ThreeDModel";
import {
  DeleteAssetByAdmin,
  DisableFromMarketButton,
  OtherButtons,
} from "./modal-action-button";

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

export default function AssetInfoModal() {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  const { getAssetBalance: creatorAssetBalance } = useUserStellarAcc();
  const { getAssetBalance: creatorStorageAssetBalance, setBalance } =
    useCreatorStorageAcc();
  const { setCurrentTrack, currentTrack, setCurrentAudioPlayingId } = usePlayer();
  const isModalOpen = isOpen && type === "my asset info modal";
  const handleClose = () => {
    setCurrentTrack(null);
    onClose();
  };

  const acc = api.wallate.acc.getCreatorStorageBallances.useQuery(undefined, {
    onSuccess: (data) => {
      setBalance(data);
    },
    onError: (error) => {
      console.log(error);
    },
    refetchOnWindowFocus: false,
    enabled: !!data.MyAsset

  })

  const copyCreatorAssetBalance = data.MyAsset
    ? selectedMenu === AssetMenu.OWN
      ? creatorAssetBalance({
        code: data.MyAsset.code,
        issuer: data.MyAsset.issuer,
      })
      : creatorStorageAssetBalance({
        code: data.MyAsset.code,
        issuer: data.MyAsset.issuer,
      })
    : 0;

  if (data.MyAsset) {
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] [&>button]:hidden">
            <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
              {/* Left Column - Product Image */}
              <Card className="max-h-[90vh] overflow-y-auto border-0 bg-[#fbfaf6] shadow-none md:w-[58%]">
                <CardContent className="space-y-6 p-5 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <h2 className="text-[1.3rem] font-semibold tracking-tight text-black md:text-[1.55rem]">
                        {data.MyAsset.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-black/70">
                        <span className="font-semibold text-black">{data.MyAsset.code}</span>
                        <span className="hidden h-5 w-px bg-black/10 md:block" />
                        <span>
                          Creator <span className="font-semibold text-black">{addrShort(data.MyAsset.creatorId, 5)}</span>
                        </span>
                      </div>
                    </div>
                    <DialogClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-transparent text-black/55 transition hover:bg-black/5 hover:text-black">
                      <X className="h-4 w-4" />
                    </DialogClose>
                  </div>
                  {/* Image Container */}
                  <div className="relative aspect-[1.45] overflow-hidden rounded-[0.95rem] bg-[#d8c7bb]">
                    <img
                      src={getSafeImageUrl(data.MyAsset.thumbnail)}
                      alt={data.MyAsset.name}
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
                        {data.MyAsset.mediaType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-[2px] border-[#e5e7eb] bg-white px-1.5 py-0.5 font-mono text-xs font-medium tracking-[0.08em] text-black shadow-none hover:bg-white"
                      >
                        {data.MyAsset.code}
                      </Badge>
                    </div>
                    <p className="min-h-[84px] text-sm leading-6 text-black/72">
                      {data.MyAsset.description ?? "No description provided for this asset."}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-black/72">
                      <span className="h-auto p-0 text-xs text-[#1677ff]">
                        Issuer: {addrShort(data.MyAsset.issuer, 5)}
                      </span>
                    </div>

                    <p className="font-medium text-black/82">
                      Available:{" "}
                      {Number(copyCreatorAssetBalance) === 0
                        ? "Sold out"
                        : Number(copyCreatorAssetBalance) === 1
                          ? "1 copy"
                          : Number(copyCreatorAssetBalance) !== undefined
                            ? `${Number(copyCreatorAssetBalance)} copies`
                            : "..."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-black/10 p-3">
                  <OtherButtons
                    currentData={data.MyAsset}
                    copies={Number(copyCreatorAssetBalance)}
                  />
                  {session.status === "authenticated" &&
                    data.MyAsset?.creatorId === session.data.user.id && (
                      <>
                        <DisableFromMarketButton
                          code={data.MyAsset.code}
                          issuer={data.MyAsset.issuer}
                        />
                      </>
                    )}
                  {data.MyAsset.mediaType === "MUSIC" ? (
                    <Button
                      onClick={() => {
                        setCurrentTrack(null);
                        setCurrentAudioPlayingId(data.MyAsset?.id ?? -1);
                        setCurrentTrack({
                          asset: data.MyAsset,
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
                    data.MyAsset.mediaType === "VIDEO" && (
                      <Button
                        onClick={() => {
                          setCurrentTrack(null);

                          setCurrentTrack({
                            asset: data.MyAsset,
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

                </CardFooter>
              </Card>

              {/* Right Column - Bundle Info */}
              <div className="border-t border-black/8 bg-[#f1eee6] md:w-[42%] md:border-l md:border-t-0">
                {data.MyAsset.mediaType === "IMAGE" ? (
                  <img
                    src={getSafeImageUrl(data.MyAsset.mediaUrl)}
                    alt={data.MyAsset.name}
                    className={clsx(
                      "h-full w-full object-cover md:min-h-[720px]",
                    )}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                    }}
                  />
                ) : data.MyAsset.mediaType === "VIDEO" ? (
                  <>
                    <div
                      style={{
                        backgroundImage: `url(${data.MyAsset.thumbnail})`,
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
                ) : data.MyAsset.mediaType === "MUSIC" ? (
                  <>
                    <div
                      style={{
                        backgroundImage: `url(${data.MyAsset.thumbnail})`,
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
                ) : (
                  data.MyAsset.mediaType === "THREE_D" && (
                    <ShowModel url={data.MyAsset.mediaUrl} />
                  )
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

