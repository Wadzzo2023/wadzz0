import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { X, Copy } from 'lucide-react';
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
import { addrShort } from "~/utils/utils";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import { SongItemType, useModal } from "~/lib/state/play/use-modal-store";
import { usePlayer } from "../context/PlayerContext";
import { useRouter } from "next/router";
import { OtherButtons } from "./modal-action-button";

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
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden border-0 bg-[#fbfaf6] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden md:flex-row">
            {/* Left Column - Image */}
            <div className="border-b border-black/8 bg-[#f1eee6] md:w-[42%] md:border-b-0 md:border-r">
              <div className="relative h-[320px] overflow-hidden bg-[#d8c7bb] md:h-full md:min-h-[720px]">
                <img
                  src={getSafeImageUrl(data.MyAsset.thumbnail)}
                  alt={data.MyAsset.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_PREVIEW_IMAGE;
                  }}
                />
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="flex w-full flex-col overflow-hidden bg-[#fbfaf6] md:w-[58%]">
              <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <h1 className="text-[1.65rem] font-semibold tracking-tight text-black md:text-[2rem]">
                      {data.MyAsset.name}
                    </h1>
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

                <div className="flex flex-wrap items-center gap-2">
                  {data.MyAsset.mediaType ? (
                    <Badge
                      variant="outline"
                      className="rounded-[2px] border-[#e5e7eb] bg-white px-1.5 py-0.5 font-mono text-xs font-medium tracking-[0.08em] text-black shadow-none hover:bg-white"
                    >
                      {data.MyAsset.mediaType}
                    </Badge>
                  ) : null}
                  {data.MyAsset.code ? (
                    <Badge
                      variant="outline"
                      className="rounded-[2px] border-[#e5e7eb] bg-white px-1.5 py-0.5 font-mono text-xs font-medium tracking-[0.08em] text-black shadow-none hover:bg-white"
                    >
                      {data.MyAsset.code}
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
                    value={addrShort(data.MyAsset.issuer, 5)}
                    valueClassName="text-[#1677ff]"
                    trailing={
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(data.MyAsset.issuer)}
                        className="inline-flex items-center justify-center text-black/55 transition hover:text-black"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    }
                  />
                  <DetailRow
                    label="Creator ID"
                    value={addrShort(data.MyAsset.creatorId, 5)}
                    trailing={
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(data.MyAsset.creatorId)}
                        className="inline-flex items-center justify-center text-black/55 transition hover:text-black"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    }
                  />
                  <DetailRow
                    label="Available"
                    value={
                      Number(copyCreatorAssetBalance) === 0
                        ? "Sold out"
                        : Number(copyCreatorAssetBalance) === 1
                          ? "1 copy"
                          : `${Number(copyCreatorAssetBalance)} copies`
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="border-b border-black/10 pb-0">
                    <h3 className="inline-block border-b-2 border-black pb-3 text-sm font-medium tracking-tight text-black">
                      Description
                    </h3>
                  </div>
                  <p className="min-h-[120px] text-sm leading-6 text-black/72">
                    {data.MyAsset.description || "No description provided for this asset."}
                  </p>
                </div>
              </div>

              <div className="border-t border-black/10 p-3">
                <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
                  <OtherButtons
                    currentData={data.MyAsset}
                    copies={Number(copyCreatorAssetBalance)}
                  />
                  {data.MyAsset.mediaType === "MUSIC" || data.MyAsset.mediaType === "VIDEO" ? (
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
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

function DetailRow({
  label,
  value,
  valueClassName,
  trailing,
}: {
  label: ReactNode;
  value: string;
  valueClassName?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-sm text-black/72">{label}</span>
      <div className="flex items-center gap-2 text-right">
        <span className={valueClassName ? `text-sm ${valueClassName}` : "text-sm text-black/82"}>{value}</span>
        {trailing}
      </div>
    </div>
  );
}

