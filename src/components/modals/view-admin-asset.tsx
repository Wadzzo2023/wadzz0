import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { clientsign, WalletType } from "package/connect_wallet";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Image from "next/image";

import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { X, MessageCircle, Sparkles } from "lucide-react";

import { Input } from "~/components/shadcn/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import { Badge } from "~/components/shadcn/ui/badge";
import { Loader } from "lucide-react";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  TrxBaseFeeInPlatformAsset,
} from "~/lib/stellar/constant";

import { addrShort } from "~/utils/utils";
import { z } from "zod";

import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import { AssetType, useModal } from "~/lib/state/play/use-modal-store";
import clsx from "clsx";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import PlaceNFT2Storage from "../marketplace/modal/place_2storage_modal";
import NftBackModal from "../marketplace/modal/revert_place_market_modal";
import EnableInMarket from "../marketplace/modal/place_market_modal";
import { useRouter } from "next/router";
import Link from "next/link";

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export default function ViewAdminAsset() {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();

  console.log("isOpen", isOpen);
  const isModalOpen = isOpen && type === "view admin asset";
  const handleClose = () => {
    onClose();
  };

  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery({
    id: data.adminAssetNtag?.id,
  });

  if (data.adminAssetNtag)
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:text-black [&>button]:border [&>button]:border-black [&>button]:rounded-full [&>button]:bg-white">

            <div className="grid grid-cols-2 md:grid-cols-7">
              {/* Left Column - Product Image */}
              <Card className=" overflow-y-auto   bg-[#1e1f22] md:col-span-3">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative aspect-square bg-[#1e1f22]">
                    <SparkleEffect />
                    <Image
                      src={data.adminAssetNtag.logoUrl}
                      alt={data.adminAssetNtag.logoUrl}
                      width={1000}
                      height={1000}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Content */}
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

                  <Link className="w-full" href={data.adminAssetNtag.StellarTerm ?? ""}>

                    <Button className="w-full" variant="outline">
                      View on StellarTerm
                    </Button>
                  </Link>
                  <Link className="w-full" href={data.adminAssetNtag.Litemint ?? ""}>

                    <Button className="w-full" variant="outline">
                      View on Litemint
                    </Button>
                  </Link>
                  <Link className="w-full" href={data.adminAssetNtag.StellarX ?? ""}>

                    <Button className="w-full" variant="outline">
                      View on StellarX
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Right Column - Bundle Info */}
              <div className=" rounded-sm bg-gray-300 p-1   md:col-span-4">

                <Image
                  src={data.adminAssetNtag.logoUrl}
                  alt={data.adminAssetNtag.logoUrl}
                  width={1000}
                  height={1000}
                  className={clsx(
                    "h-full w-full object-cover "

                  )}
                />

              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
}

function SparkleEffect() {
  return (
    <motion.div
      className="absolute inset-0"
      initial="initial"
      animate="animate"
    >
      {[...Array({ length: 20 })].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-yellow-300"
          initial={{
            opacity: 0,
            scale: 0,
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
function DeleteAssetByAdmin({ id }: { id: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const admin = api.wallate.admin.checkAdmin.useQuery();
  const del = api.marketplace.market.deleteMarketAsset.useMutation({
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  if (admin.data)
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant={"destructive"} className="w-full ">
              {del.isLoading && <span className="loading loading-spinner" />}
              Delete (Admin)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmation </DialogTitle>
            </DialogHeader>
            <div>
              <p>
                Are you sure you want to delete this item? This action is
                irreversible.
              </p>
            </div>
            <DialogFooter className=" w-full">
              <div className="flex w-full gap-4  ">
                <DialogClose className="w-full">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  type="submit"
                  onClick={() => del.mutate(id)}
                  disabled={del.isLoading}
                  className="w-full"
                >
                  {del.isLoading && (
                    <span className="loading loading-spinner" />
                  )}
                  Confirm
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}
export function DisableFromMarketButton({
  code,
  issuer,
}: {
  code: string;
  issuer: string;
}) {
  const { setData } = useMarketRightStore();
  const disable = api.marketplace.market.disableToMarketDB.useMutation({
    onSuccess() {
      setData(undefined);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <div className="flex w-full flex-col gap-2">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant={"outline"} className="w-full ">
            {disable.isLoading && <span className="loading loading-spinner" />}
            DISABLE
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
            <div className="flow-root">
              <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                <dl className="flex items-center justify-between gap-4 py-3">
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    Do you want to disable this item from the market?
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <DialogFooter className=" w-full">
            <div className="flex w-full gap-4  ">
              <DialogClose className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={disable.isLoading}
                variant="destructive"
                type="submit"
                onClick={() => disable.mutate({ code, issuer })}
                className="w-full"
              >
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OtherButtons({
  currentData,
  copies,
}: {
  currentData: AssetType;
  copies: number | undefined;
}) {
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  const { hasTrust } = useUserStellarAcc();
  const trust = hasTrust(currentData.code, currentData.issuer);
  console.log("trust", trust);
  if (currentData && copies && trust) {
    if (selectedMenu == AssetMenu.OWN) {
      return <PlaceNFT2Storage item={{ ...currentData, copies }} />;
    }
    if (selectedMenu == AssetMenu.STORAGE) {
      return (
        <MarketButtons
          copy={copies}
          code={currentData.code}
          issuer={currentData.issuer}
        />
      );
    }
  }
}

function MarketButtons({
  code,
  issuer,
  copy,
}: {
  code: string;
  issuer: string;
  copy: number;
}) {
  const inMarket = api.wallate.acc.getAStorageAssetInMarket.useQuery({
    code,
    issuer,
  });
  if (inMarket.isLoading) return <div>Loading...</div>;

  if (inMarket.data)
    return (
      <div>
        <span className="text-center text-xs text-red-50">
          {" "}
          Item has been placed in market
        </span>
        <NftBackModal copy={copy} item={{ code, issuer }} />
      </div>
    );
  else return <EnableInMarket copy={copy} item={{ code, issuer }} />;
}