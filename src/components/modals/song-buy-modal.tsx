import { useSession } from "next-auth/react";
import Image from "next/image";
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
import { useRouter } from "next/router";
import { Card, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import { useModal } from "~/lib/state/play/use-modal-store";
import BuyItem from "../BuyItem";
import { DeleteAssetByAdmin, DisableFromMarketButton, OtherButtons, SparkleEffect } from "./modal-action-button";
import toast from "react-hot-toast";

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export default function SongBuyModal() {
  const [step, setStep] = useState(1);

  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const router = useRouter();
  const isCollectionRoute = router.pathname.startsWith("/assets");

  const isModalOpen = isOpen && type === "song buy modal";
  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery(
    {
      id: data.Song?.asset?.id,
    },
    {
      enabled: !!data.Song?.asset,
    },
  );

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const { data: canBuyUser } =
    api.marketplace.market.userCanBuyThisMarketAsset.useQuery(
      data.Song?.asset?.id ?? 0,
      {
        enabled: !!data.Song?.asset,
      },
    );

  if (!data.Song || !data.Song.asset)
    return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl overflow-hidden p-1   ">
          <DialogClose className="absolute right-3 top-3 ">
            <X color="white" size={24} />
          </DialogClose>
          <div className="grid grid-cols-1">
            {/* Left Column - Product Image */}
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

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[800px]  max-w-3xl  overflow-y-auto  p-0 [&>button]:rounded-full [&>button]:border [&>button]:border-black [&>button]:bg-white [&>button]:text-black">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-7 ">
              {/* Left Column - Product Image */}
              <Card className="   bg-[#1e1f22] md:col-span-3">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative aspect-square bg-[#1e1f22]">
                    <SparkleEffect />
                    <Image
                      src={data.Song.asset.thumbnail}
                      alt={data.Song.asset.name}
                      width={1000}
                      height={1000}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-3 p-4">
                    <h2 className="text-xl font-bold text-white">
                      {data.Song.asset.name}
                    </h2>

                    <p className="max-h-[100px] min-h-[100px]  overflow-y-auto text-sm text-gray-400">
                      {data.Song.asset.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {data.Song.price} {PLATFORM_ASSET.code}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-none bg-white text-[#3ba55c]"
                      >
                        $ {data.Song.priceUSD}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="h-auto p-0 text-xs text-[#00a8fc]">
                        {addrShort(data.Song.asset.issuer, 5)}
                      </span>
                      <Badge variant="destructive" className=" rounded-lg">
                        #{data.Song.asset.code}
                      </Badge>
                    </div>
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
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-1 p-2">
                  {session.status === "authenticated" &&
                    data.Song.asset.creatorId === session.data.user.id &&
                    isCollectionRoute ? (
                    <>
                      <DisableFromMarketButton
                        code={data.Song.asset.code}
                        issuer={data.Song.asset.issuer}
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

                  <DeleteAssetByAdmin id={data.Song.id}
                    handleClose={handleClose} />

                  <p className="text-xs text-gray-400">
                    Once purchased, this item will be placed on collection.
                  </p>
                </CardFooter >
              </Card >

              {/* Right Column - Bundle Info */}
              < div className=" hidden rounded-sm bg-gray-300   p-1  md:col-span-4 md:grid " >
                {
                  data.Song.asset.mediaType === "IMAGE" ? (
                    <Image
                      src={data.Song.asset.mediaUrl}
                      alt={data.Song.asset.name}
                      width={1000}
                      height={1000}
                      className={clsx(
                        "h-full w-full object-cover ",
                        data.Song.asset.tierId ? " blur-md" : "",
                      )}
                    />
                  ) : data.Song.asset.mediaType === "VIDEO" ? (
                    <Image
                      src={data.Song.asset.thumbnail}
                      alt={data.Song.asset.name}
                      width={1000}
                      height={1000}
                      className={clsx(
                        "h-full w-full object-cover ",
                        data.Song.asset.tierId ? " blur-md" : "",
                      )}
                    />
                  ) : (
                    data.Song.asset.mediaType === "MUSIC" && (
                      <Image
                        src={data.Song.asset.thumbnail}
                        alt={data.Song.asset.name}
                        width={1000}
                        height={1000}
                        className={clsx(
                          "h-full w-full object-cover ",
                          data.Song.asset.tierId ? " blur-md" : "",
                        )}
                      />
                    )
                  )
                }
              </div >
            </div >
          )
          }
          {
            step === 2 && (
              <Card>
                <CardContent className="p-0">
                  <BuyItem
                    marketItemId={data.Song.asset.id}
                    priceUSD={data.Song.priceUSD}
                    item={data.Song.asset}
                    price={data.Song.price}
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
            )
          }
          {/* <DialogFooter>
                            {step > 1 && (
                                <Button onClick={handleBack} variant="outline">
                                    Back
                                </Button>
                            )}
                            {step < 2 ? (
                                <Button onClick={handleNext}>Next</Button>
                            ) : (
                                <Button onClick={handleSubmit}>Submit</Button>
                            )}
                        </DialogFooter> */}
        </DialogContent >
      </Dialog >
    </>
  );
}
