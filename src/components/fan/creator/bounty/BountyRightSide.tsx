import Link from "next/link";
import { useRouter } from "next/router";
import { Skeleton } from "package/connect_wallet/src/shadcn/ui/skeleton";
import toast from "react-hot-toast";
import { Preview } from "~/components/preview";
import { Badge } from "~/components/shadcn/ui/badge";
import { Button } from "~/components/shadcn/ui/button";
import ImageVideViewer from "~/components/wallete/Image_video_viewer";
import { useBountyRightStore } from "~/lib/state/bounty/use-bounty-store";
import { usePopUpState } from "~/lib/state/right-pop";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

const BountyRightBar = () => {
  const { currentData } = useBountyRightStore();
  console.log(currentData);
  const router = useRouter();
  const { platformAssetBalance } = useUserStellarAcc();
  const utils = api.useUtils();
  const joinBountyMutation = api.bounty.Bounty.joinBounty.useMutation({
    onSuccess: async (data) => {
      toast.success("Bounty Joined");
      await utils.bounty.Bounty.isAlreadyJoined.refetch();
      await router.push(`/bounty/${currentData?.id}`);
    },
  });
  const pop = usePopUpState();
  const bountyStore = useBountyRightStore();
  const handleJoinBounty = (id: number) => {
    joinBountyMutation.mutate({ BountyId: id });
  };

  const { data: Owner, isLoading } = api.bounty.Bounty.isOwnerOfBounty.useQuery({
    BountyId: currentData?.id ?? 0,
  }, {
    enabled: !!currentData
  });

  const isAlreadyJoin = api.bounty.Bounty.isAlreadyJoined.useQuery({
    BountyId: currentData?.id ?? 0,
  }, {
    enabled: !!currentData
  });

  if (isLoading || isAlreadyJoin.isLoading) {
    return (
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl">
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="flex h-full flex-col gap-2">
            <div className="avatar relative w-full rounded-xl border-4 border-base-100">
              <div className="relative m-8 w-full">
                <Skeleton className="aspect-video w-full" />
              </div>
            </div>
            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-4 text-sm tracking-wider">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </div>
            <div className="p-2">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentData && Owner && isAlreadyJoin.data)
    return (
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl">
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="flex h-full flex-col gap-2 ">
            <div className="avatar relative w-full rounded-xl border-4 border-base-100 ">
              <div className="relative m-8 w-full ">
                <ImageVideViewer
                  code={"Bounty"}
                  url={currentData.imageUrls[0] ?? "/images/logo.png"}
                  blurData={"noting"}
                />
              </div>
            </div>
            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-4 text-sm tracking-wider">
              <div className="flex flex-col gap-2">
                <p className="font-semibold uppercase">
                  <span>Title:</span> {currentData.title}
                </p>

                <p className="font-semibold ">
                  <b className="uppercase">Description: </b>
                  <Preview value={currentData.description} />
                </p>

                <p>
                  <span className="font-semibold uppercase">
                    Prize in USD $: {currentData.priceInUSD.toFixed(2)}
                  </span>
                </p>
                <p>
                  <span className="font-semibold uppercase">
                    Prize in {PLATFORM_ASSET.code} : {currentData.priceInBand}
                  </span>
                </p>
                <div className="font-semibold uppercase">
                  Status:
                  {currentData.status === "PENDING" ? (
                    <span className="select-none items-center whitespace-nowrap rounded-md bg-indigo-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-indigo-900">
                      {currentData.status}
                    </span>
                  ) : currentData.status === "APPROVED" ? (
                    <span className=" select-none items-center whitespace-nowrap rounded-md bg-green-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-green-900">
                      {currentData.status}
                    </span>
                  ) : (
                    <span className="select-none items-center whitespace-nowrap rounded-md bg-red-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-red-900">
                      {currentData.status}
                    </span>
                  )}
                </div>
                <p className="font-semibold uppercase">
                  <Badge
                    variant={currentData._count.BountyWinner === 0 ? "destructive" : "default"}
                  >
                    {currentData.totalWinner === currentData.currentWinnerCount ? "Finished" : (currentData.totalWinner - currentData.currentWinnerCount) + " Winner Left"}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="p-2">
              {isAlreadyJoin.isLoading ? (
                <div className="mb-2.5 h-10  bg-gray-200 dark:bg-gray-700"></div>
              ) : isAlreadyJoin?.data?.isJoined || Owner?.isOwner ? (
                <Link
                  href={`/bounty/${currentData.id}`}
                  className="w-full"
                  onClick={() => {
                    pop.setOpen(false);
                    bountyStore.setOpen(false);
                    bountyStore.setData(undefined);
                  }}
                >
                  <Button className="w-full">View Bounty</Button>
                </Link>
              ) : currentData.requiredBalance > platformAssetBalance ? (
                <Button className="w-full" disabled variant={"destructive"}>
                  Required {currentData.requiredBalance} {PLATFORM_ASSET.code}
                </Button>
              ) : currentData.totalWinner === currentData.currentWinnerCount ? (
                <Button className="w-full" disabled variant={"destructive"}>
                  Bounty Finished
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={
                    joinBountyMutation.isLoading || isAlreadyJoin.isLoading
                  }
                  onClick={() => handleJoinBounty(currentData.id)}
                >
                  Join Bounty
                </Button>
              )
              }
            </div>
          </div>
        </div>
      </div>
    );
};

export default BountyRightBar;
