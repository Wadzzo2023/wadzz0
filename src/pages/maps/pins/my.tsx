import { Location, LocationConsumer, LocationGroup } from "@prisma/client";
import { formatDate } from "date-fns";
import Image from "next/image";
import { useModal } from "~/lib/state/play/use-modal-store";
import { Button } from "~/components/shadcn/ui/button";
import { api } from "~/utils/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs"
import { useState } from "react";
import { Check, Gift, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { toast } from "~/hooks/use-toast";
import { useSession } from "next-auth/react";
import { addrShort } from "~/utils/utils";
import useNeedSign from "~/lib/hook";
import { clientsign } from "package/connect_wallet";
import { clientSelect } from "~/lib/stellar/fan/utils";
interface GiftTabProps {
  customerPubkey: string
}
export default function Page() {
  const session = useSession()
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="consumed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consumed">Consumed Pins</TabsTrigger>
          <TabsTrigger value="gifts">Gift Items</TabsTrigger>
        </TabsList>
        <TabsContent value="consumed">
          <ConsumedPins />
        </TabsContent>
        <TabsContent value="gifts">
          <GiftTab customerPubkey={
            session.data?.user?.id ?? ""
          } />

        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConsumedPins() {
  const consumedPins = api.maps.pin.getAUserConsumedPin.useQuery();

  if (consumedPins.isLoading) return <p>Loading...</p>;
  if (consumedPins.isError) return <p>Error</p>;

  return (
    <div className=" overflow-x-auto p-4">
      <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Location
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Approve Status
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Closed At
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                LAT | LNG
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-100 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Claim Status
              </th>
            </tr>
          </thead>
          <tbody>
            {consumedPins.data.map((pin, id) => {
              return (
                <ClaimConsumedPin key={id} pin={pin} location={pin.location} />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// TODO: claim pin
function ClaimConsumedPin({
  pin,
  location,
  key,
}: {
  pin: LocationConsumer;
  location: Location & {
    locationGroup: LocationGroup | null;
  };
  key: number;
}) {
  const { onOpen } = useModal();
  if (!location.locationGroup) return;
  return (
    <>
      <tr>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <Image
                height={1000}
                width={1000}
                className="h-full w-full rounded-full object-contain"
                src={location.locationGroup.image ?? "/images/icons/wadzzo.svg"}
                alt=""
              />
            </div>
            <div className="ml-3">
              <p className="whitespace-no-wrap text-gray-900">
                {formatTitle(location.locationGroup.title)}
              </p>
            </div>
          </div>
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          {location.locationGroup.approved ? (
            <span className="relative me-2 inline-block rounded border border-green-400 bg-green-100 px-2.5 py-0.5  text-xs font-medium leading-tight text-green-800 dark:bg-gray-700 dark:text-green-400">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-green-200 opacity-50"
              ></span>
              <span className="relative">Approved</span>
            </span>
          ) : (
            <span className="relative me-2  inline-block rounded  border   border-indigo-400 bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-gray-700 dark:text-indigo-400">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-indigo-100 opacity-50"
              ></span>
              <span className="relative">Pending</span>
            </span>
          )}
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <p className="whitespace-no-wrap text-gray-900">
            {formatDate(new Date(location.locationGroup.endDate), "dd/MM/yyyy")}
          </p>
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <p className="whitespace-no-wrap text-gray-900">
            {location.latitude} | {location.longitude}
          </p>
        </td>
        <td className="border-b border-gray-200 bg-white px-5 py-5 text-sm">
          <p className="whitespace-no-wrap text-gray-900">
            <ClaimButton />
          </p>
        </td>
      </tr>
    </>
  );

  function ClaimButton() {
    console.log("location........", location, location.locationGroup)

    if (!location.locationGroup) return;
    if (pin.claimedAt) {

      return (
        <Button variant="secondary" className="" disabled>
          Claimed
        </Button>
      );
    } else if (
      location.locationGroup.assetId ??
      location.locationGroup.pageAsset
    ) {
      return (
        <Button
          variant="destructive"
          className="px-6 font-bold "
          onClick={() =>
            onOpen("claim pin", {
              location: location,
              locationConsumer: pin,
            })
          }
        >
          Claim
        </Button>
      );
    } else {
      return (
        <p className="me-2 rounded border border-pink-400 bg-pink-100 px-2.5 py-0.5 text-center text-xs font-medium text-pink-800 dark:bg-gray-700 dark:text-pink-400">
          Not claimable
        </p>
      );
    }
  }
}

function formatTitle(title: string) {
  return title.length > 20 ? title.slice(0, 20) + "..." : title;
}




export function GiftTab({ customerPubkey }: GiftTabProps) {
  const [activeTab, setActiveTab] = useState<"available" | "collected">("available")
  const [collectedGifts, setCollectedGifts] = useState<Set<string>>(new Set())

  const { data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch,
    isFetchingNextPage,
    status, } = api.walletBalance.wallBalance.getGiftWithHomeBalance.useInfiniteQuery({ limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      })


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="h-6 w-6" />
          Your Gifts
        </h2>
        <Button variant="outline" size="icon" onClick={
          () => refetch()
        } disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>




      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {
          data?.pages.map((page, index) => {
            return page.balances.map((gift) => {
              return (
                <GiftCard
                  key={gift.id}
                  id={gift.id}
                  amount={gift.amount}
                  asset={gift.asset}
                  sponsor={gift.sponsor}
                  isCollected={collectedGifts.has(gift.id)}
                  customerPubkey={customerPubkey}
                />
              )
            })
          }
          )
        }
      </motion.div>




      {hasNextPage && (
        <Button
          className="flex w-1/2 items-center justify-center  shadow-sm shadow-black md:w-1/4"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </Button>
      )}


    </div>
  )
}





interface GiftCardProps {
  id: string
  amount: string
  asset: string
  sponsor?: string
  isCollected?: boolean
  customerPubkey: string

}

export function GiftCard({
  id,
  amount,
  asset,
  sponsor,
  isCollected = false,
  customerPubkey,

}: GiftCardProps) {
  const [isCollecting, setIsCollecting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { needSign } = useNeedSign();
  const session = useSession()
  const AcceptClaimMutation =
    api.walletBalance.wallBalance.claimBalance.useMutation({
      onSuccess(data) {
        clientsign({
          presignedxdr: data,
          walletType: session.data?.user?.walletType,
          pubkey: session.data?.user.id,
          test: clientSelect(),
        })
          .then((result) => {

            if (result) {
              toast({
                title: "Claim Balance successful",
                description: "You have successfully claimed the balance",

              })
            } else {
              toast({
                title: "Claim Balance failed",
                description: "You have failed to claim the balance",
              })
            }
          })
          .catch((e) => {
            console.log("error", e);
            toast({
              title: "Adding Claim Balance Operation failed",
              description: "You have failed to add the claim balance operation",
            })
          })
          .finally(() => {
            setIsCollecting(false);
            setShowConfirmDialog(false)
          });
      },

      onError(error) {
        console.log("error", error);
        setIsCollecting(false);
        setShowConfirmDialog(false)
      },
    });

  const HandleConfirm = async (id: string) => {
    setIsCollecting(true)

    AcceptClaimMutation.mutate({
      balanceId: id,
      signWith: needSign(),
    });

  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`relative overflow-hidden ${isCollected ? "bg-muted" : "hover:shadow-lg"} transition-shadow duration-300`}
        >
          {isCollected && (
            <div className="absolute top-0 right-0 m-4">
              <Check className="h-6 w-6 text-primary" />
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span>
                {amount} {asset.split(":")[0]}
              </span>
            </CardTitle>
            <CardDescription>From: {addrShort(sponsor, 7) || "Anonymous"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Gift className="h-16 w-16 text-primary opacity-20" />
              </motion.div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              variant={isCollected ? "secondary" : "default"}
              disabled={isCollected || isCollecting}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isCollecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Collecting...
                </>
              ) : isCollected ? (
                "Collected"
              ) : (
                "Collect Gift"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Gift</DialogTitle>
            <DialogDescription>
              Are you sure you want to collect this gift of {amount} {asset.split(":")[0]}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowConfirmDialog(false)} disabled={isCollecting}>
              Cancel
            </Button>
            <Button disabled={isCollecting}

              onClick={() => HandleConfirm(id)}
            >
              {isCollecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Collecting...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

