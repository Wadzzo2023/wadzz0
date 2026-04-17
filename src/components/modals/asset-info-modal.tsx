import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

import { X, MapPin, Crosshair, Layers3 } from 'lucide-react';
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
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

import clsx from "clsx";
import Map, { Marker, NavigationControl } from "react-map-gl";
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
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API ?? "";
const DEFAULT_CENTER = { latitude: 23.8103, longitude: 90.4125 };

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
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border border-white/45 bg-[linear-gradient(140deg,rgba(255,255,255,0.72),rgba(255,255,255,0.45))] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl [&>button]:hidden">
            <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
              {/* Left Column - Product Image */}
              <Card className="max-h-[90vh] overflow-y-auto border-0 bg-transparent shadow-none md:w-[58%]">
                <CardContent className="space-y-6 p-5 md:p-8">
                  <div className="relative overflow-hidden rounded-2xl border border-white/65 bg-white/35 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm">
                    <div className="relative h-56 w-full overflow-hidden md:h-64">
                      {MAPBOX_TOKEN ? (
                        <Map
                          mapboxAccessToken={MAPBOX_TOKEN}
                          initialViewState={{
                            latitude: DEFAULT_CENTER.latitude,
                            longitude: DEFAULT_CENTER.longitude,
                            zoom: 11.6,
                            pitch: 42,
                            bearing: -18,
                          }}
                          mapStyle="mapbox://styles/mapbox/light-v11"
                          reuseMaps
                          style={{ width: "100%", height: "100%" }}
                        >
                          <NavigationControl position="top-right" />
                          <Marker
                            latitude={DEFAULT_CENTER.latitude}
                            longitude={DEFAULT_CENTER.longitude}
                            anchor="bottom"
                          >
                            <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#1f86ee] text-white shadow-lg">
                              <MapPin className="h-4 w-4" />
                            </div>
                          </Marker>
                        </Map>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dbe8ff] via-[#c9ddff] to-[#b7d0ff]">
                          <p className="text-sm font-medium text-black/70">
                            Map preview unavailable (missing Mapbox token)
                          </p>
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

                      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-black/80 backdrop-blur">
                        <Crosshair className="h-3.5 w-3.5 text-[#1f86ee]" />
                        Interactive Asset Map
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-white/65 bg-white/70 px-2.5 py-2 text-xs text-black/78 backdrop-blur">
                          <div className="flex items-center gap-1 font-medium">
                            <Layers3 className="h-3.5 w-3.5 text-[#1f86ee]" />
                            Asset
                          </div>
                          <p className="line-clamp-1 text-[11px] text-black/62">{data.MyAsset.name}</p>
                        </div>
                        <div className="rounded-lg border border-white/65 bg-white/70 px-2.5 py-2 text-xs text-black/78 backdrop-blur">
                          <p className="font-medium">Issuer</p>
                          <p className="text-[11px] text-[#1677ff]">{addrShort(data.MyAsset.issuer, 5)}</p>
                        </div>
                        <div className="rounded-lg border border-white/65 bg-white/70 px-2.5 py-2 text-xs text-black/78 backdrop-blur">
                          <p className="font-medium">Availability</p>
                          <p className="text-[11px] text-black/62">
                            {Number(copyCreatorAssetBalance) === 0
                              ? "Sold out"
                              : `${Number(copyCreatorAssetBalance)} copies`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

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

                    <div className="space-y-1">
                      <span className="text-[0.95rem] font-medium tracking-tight text-black md:text-[1.05rem]">
                        {typeof data.MyAsset.marketPrice === "number"
                          ? `${data.MyAsset.marketPrice.toFixed(2)} ${PLATFORM_ASSET.code.toUpperCase()}`
                          : "Not listed"}
                      </span>
                      {typeof data.MyAsset.marketPriceUSD === "number" ? (
                        <p className="text-sm text-black/62">~${data.MyAsset.marketPriceUSD.toFixed(2)}</p>
                      ) : null}
                    </div>

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
              <div className="border-t border-white/50 bg-white/35 backdrop-blur-sm md:w-[42%] md:border-l md:border-t-0">
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

