import Link from "next/link";
import { useRouter } from "next/router";
import { Skeleton } from "package/connect_wallet/src/shadcn/ui/skeleton";
import toast from "react-hot-toast";
import { Preview } from "~/components/preview";
import { Button } from "~/components/shadcn/ui/button";
import { useBountyRightStore } from "~/lib/state/bounty/use-bounty-store";
import { usePopUpState } from "~/lib/state/right-pop";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

const BountyRightBar = () => {
  const { currentData } = useBountyRightStore();
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

  const { data: Owner } = api.bounty.Bounty.isOwnerOfBounty.useQuery({
    BountyId: currentData?.id ?? 0,
  });

  const isAlreadyJoin = api.bounty.Bounty.isAlreadyJoined.useQuery({
    BountyId: currentData?.id ?? 0,
  });
  console.log(currentData);
  if (currentData && Owner && isAlreadyJoin.data)
    return (
      <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl">
        <div className="flex h-full flex-col justify-between space-y-2 p-2">
          <div className="flex h-full flex-col gap-2 ">
            <div className="relative flex-1 space-y-2 rounded-xl border-4 border-base-100 p-4 text-sm tracking-wider">
              <div className="flex flex-col gap-2">
                <p>
                  <span className="font-semibold uppercase">Title:</span>{" "}
                  {currentData.title}
                </p>

                <p className="line-clamp-2 ">
                  <b className="uppercase">Description: </b>
                  <Preview value={currentData.description} />
                </p>

                <p>
                  <span className="font-semibold uppercase">
                    Price in USD $: {currentData.priceInUSD}
                  </span>
                </p>
                <p>
                  <span className="font-semibold uppercase">
                    Price in {PLATFROM_ASSET.code} : {currentData.priceInBand}
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
                  WINNER:{" "}
                  {currentData.winner?.name ? (
                    <span className="me-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                      {currentData.winner.name}
                    </span>
                  ) : (
                    <span className="me-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      NOT ANNOUNCED
                    </span>
                  )}
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
                  Required {currentData.requiredBalance} {PLATFROM_ASSET.code}
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
              )}
            </div>
          </div>
        </div>
      </div>
    );
};

export default BountyRightBar;
