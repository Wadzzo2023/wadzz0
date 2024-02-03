import { useRouter } from "next/router";
import React from "react";
import { PostCard } from "~/components/creator/CreatPost";
import { api } from "~/utils/api";
import { CreatorBack } from "../me/creator";
import { Creator } from "@prisma/client";
import MemberShipCard from "~/components/creator/card";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import toast from "react-hot-toast";

export default function CreatorPage() {
  const router = useRouter();
  const creatorId = router.query.id;

  if (typeof creatorId == "string" && creatorId.length === 56) {
    return <Page creatorId={creatorId} />;
  }

  return <div>Error</div>;
}

function Page({ creatorId }: { creatorId: string }) {
  const { data, isLoading, error } = api.post.getPosts.useQuery({
    pubkey: creatorId,
  });
  const { data: creator } = api.creator.getCreator.useQuery({ id: creatorId });
  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  if (data)
    return (
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center ">
          {creator && (
            <>
              <CreatorBack creator={creator} />
              <ChooseMemberShip creator={creator} />
            </>
          )}
          {data.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.map((el) => (
                <PostCard like={el._count.Like} key={el.id} post={el} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
}

function ChooseMemberShip({ creator }: { creator: Creator }) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const { data: subscriptonModel, isLoading } =
    api.member.getCreatorMembership.useQuery(creator.id);
  const subscribe = api.member.subscribe.useMutation();

  const mutation = api.trx.clawbackAssetPaymentTrx.useMutation({
    onSuccess(data, variables, context) {
      if (data) {
        clientsign({
          walletType,
          presignedxdr: data,
          pubkey: "GD5LKBBNYRQLL2GXV7OC43KZAYVLNJT6NRI3HJTYQWXRLL7UPPMOVDVY",
        }).then((res) => {
          if (res) {
            toast.success("popup success");
          }
        });
      }
    },
  });

  const { data: subscriptions } = api.member.userSubscriptions.useQuery();

  return (
    <div className="mb-10 flex flex-col gap-4">
      <h2 className="text-center text-2xl font-bold">Choose your Membership</h2>
      {isLoading && <div>Loading...</div>}
      <div className="flex gap-2">
        {subscriptonModel?.map((el) => (
          <MemberShipCard
            key={el.id}
            className="w-48 bg-neutral text-neutral-content"
            creator={creator}
            subscription={el}
          >
            {/* <div className="card-actions justify-end"> */}
            <button
              className="btn btn-primary"
              disabled={subscriptions?.some(
                (sub) => sub.subscriptionId === el.id,
              )}
              onClick={() =>
                subscribe.mutate({
                  subscriptionId: el.id,
                })
              }
            >
              {subscribe.isLoading ? "Loading..." : "Subscribe"}
            </button>
          </MemberShipCard>
        ))}
      </div>
    </div>
  );
}
