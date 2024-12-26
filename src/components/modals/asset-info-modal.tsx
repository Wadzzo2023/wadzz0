import { useSession } from "next-auth/react";
import Image from "next/image";
import { api } from "~/utils/api";

import { X } from "lucide-react";
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
  SparkleEffect,
} from "./modal-action-button";

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export default function AssetInfoModal() {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  const { getAssetBalance: creatorAssetBalance } = useUserStellarAcc();
  const { getAssetBalance: creatorStorageAssetBalance, setBalance } =
    useCreatorStorageAcc();
  console.log("isOpen", isOpen);
  const { setCurrentTrack, currentTrack } = usePlayer();
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
  });

  const copyCreatorAssetBalance =
    selectedMenu === AssetMenu.OWN
      ? creatorAssetBalance({
          code: data?.MyAsset?.code,
          issuer: data?.MyAsset?.issuer,
        })
      : creatorStorageAssetBalance({
          code: data?.MyAsset?.code,
          issuer: data?.MyAsset?.issuer,
        });

  if (data.MyAsset)
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:rounded-full [&>button]:border [&>button]:border-black [&>button]:bg-white [&>button]:text-black ">
            <DialogClose className="absolute right-3 top-3 ">
              <X color="white" size={24} />
            </DialogClose>
            <div className="grid grid-cols-2 md:grid-cols-7">
              {/* Left Column - Product Image */}
              <Card className=" overflow-y-auto   bg-[#1e1f22] md:col-span-3">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative aspect-square bg-[#1e1f22]">
                    <SparkleEffect />
                    <Image
                      src={data.MyAsset.thumbnail}
                      alt={data.MyAsset.name}
                      width={1000}
                      height={1000}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-3 p-4">
                    <h2 className="text-xl font-bold text-white">
                      NAME: {data.MyAsset.name}
                    </h2>

                    <p className="max-h-[100px] min-h-[100px] overflow-y-auto text-sm text-gray-400">
                      DESCRIPTION: {data.MyAsset.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="h-auto p-0 text-xs text-[#00a8fc]">
                        ISSUER ID: {addrShort(data.MyAsset.issuer, 5)}
                      </span>
                      <Badge variant="secondary" className=" rounded-lg">
                        {data.MyAsset.code}
                      </Badge>
                    </div>

                    <p className="font-semibold text-white">
                      <span className="">Available:</span>{" "}
                      {Number(copyCreatorAssetBalance) === 0
                        ? "Sold out"
                        : Number(copyCreatorAssetBalance) === 1
                          ? "1 copy"
                          : Number(copyCreatorAssetBalance) !== undefined
                            ? `${Number(copyCreatorAssetBalance)} copies`
                            : "..."}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="h-auto p-0 text-xs text-[#00a8fc]">
                        Media Type:
                      </span>
                      <Badge variant="destructive" className=" rounded-lg">
                        {data.MyAsset.mediaType}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-1 p-2">
                  <OtherButtons
                    currentData={data.MyAsset}
                    copies={Number(copyCreatorAssetBalance)}
                  />
                  {session.status === "authenticated" &&
                    data.MyAsset.creatorId === session.data.user.id && (
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
                      className="w-full"
                      variant="secondary"
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
                        className="w-full"
                        variant="secondary"
                      >
                        Play
                      </Button>
                    )
                  )}
                  <DeleteAssetByAdmin id={data.MyAsset.id} />
                </CardFooter>
              </Card>

              {/* Right Column - Bundle Info */}
              <div className=" rounded-sm bg-gray-300 p-1   md:col-span-4">
                {data.MyAsset.mediaType === "IMAGE" ? (
                  <Image
                    src={data.MyAsset.mediaUrl}
                    alt={data.MyAsset.name}
                    width={1000}
                    height={1000}
                    className={clsx(
                      "h-full max-h-[800px] w-full overflow-y-auto object-cover ",
                    )}
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
                        "h-full max-h-[800px] w-full overflow-y-auto object-cover",
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
                        "h-full max-h-[800px] w-full overflow-y-auto object-cover",
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
