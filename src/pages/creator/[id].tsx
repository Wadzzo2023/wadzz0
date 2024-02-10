import { useRouter } from "next/router";
import React from "react";
import { PostCard } from "~/components/creator/post";
import { api } from "~/utils/api";
import { CreatorBack } from "../me/creator";
import { Creator, Subscription } from "@prisma/client";
import MemberShipCard from "~/components/creator/card";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import toast from "react-hot-toast";
import { MyAssetType } from "~/lib/stellar/utils";
import {
  CreatorProfileMenu,
  useCreatorProfileMenu,
} from "~/lib/state/creator-profile-menu";
import clsx from "clsx";
import { ShopItem } from "~/components/creator/shop";

export default function CreatorPage() {
  const router = useRouter();
  const creatorId = router.query.id;

  if (typeof creatorId == "string" && creatorId.length === 56) {
    return <CreatorPageView creatorId={creatorId} />;
  }

  return <div>Error</div>;
}

function CreatorPageView({ creatorId }: { creatorId: string }) {
  const { data: creator } = api.creator.getCreator.useQuery({ id: creatorId });
  if (creator)
    return (
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center ">
          <>
            <CreatorBack creator={creator} />
            <ChooseMemberShip creator={creator} />
            <Tabs />
            <RenderTabs creatorId={creatorId} />
          </>
        </div>
      </div>
    );
}

function CreatorPosts({ creatorId }: { creatorId: string }) {
  const { data, isLoading, error } = api.post.getPosts.useQuery({
    pubkey: creatorId,
  });
  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  if (data && data.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((el) => (
          <PostCard
            comments={el._count.Comment}
            creator={el.creator}
            like={el._count.Like}
            key={el.id}
            post={el}
          />
        ))}
      </div>
    );
  }
}

function RenderTabs({ creatorId }: { creatorId: string }) {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  switch (selectedMenu) {
    case CreatorProfileMenu.Contents:
      return <CreatorPosts creatorId={creatorId} />;
    case CreatorProfileMenu.Shop:
      return <AllShopItems creatorId={creatorId} />;
  }
}

function Tabs() {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  return (
    <div role="tablist" className="tabs tabs-bordered my-5">
      {Object.values(CreatorProfileMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx("tab", selectedMenu == key && "tab-active")}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}

export function ChooseMemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptonModel, isLoading } =
    api.member.getCreatorMembership.useQuery(creator.id);

  return (
    <div className="mb-10 flex flex-col gap-4">
      <h2 className="text-center text-2xl font-bold">Choose your Membership</h2>
      {isLoading && <div>Loading...</div>}
      <div className="flex gap-2">
        {subscriptonModel?.map((el) => (
          <SubscriptionCard key={el.id} creator={creator} subscription={el} />
        ))}
      </div>
    </div>
  );
}

function SubscriptionCard({
  subscription,
  creator,
}: {
  subscription: Subscription & { asset: MyAssetType };
  creator: Creator;
}) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const { data: subscriptions } = api.member.userSubscriptions.useQuery();
  const subscribe = api.member.subscribe.useMutation();

  const xdrMutation = api.trx.clawbackAssetPaymentTrx.useMutation({
    onSuccess(data, variables, context) {
      if (data) {
        clientsign({
          walletType,
          presignedxdr: data,
          pubkey,
          test: true,
        })
          .then((res) => {
            if (res) {
              toast.success("popup success");
              subscribe.mutate({
                subscriptionId: subscription.id,
                creatorId: creator.id,
                days: subscription.days,
              });
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    },
  });

  return (
    <MemberShipCard
      key={subscription.id}
      className=" bg-neutral text-neutral-content"
      creator={creator}
      subscription={subscription}
    >
      {/* <div className="card-actions justify-end"> */}
      <button
        className="btn btn-primary"
        disabled={subscriptions?.some(
          (sub) => sub.subscriptionId === subscription.id,
        )}
        onClick={() =>
          // subscribe.mutate({
          //   subscriptionId: el.id,
          // })
          xdrMutation.mutate(subscription.asset)
        }
      >
        {subscribe.isLoading ? "Loading..." : "Subscribe"}
      </button>
    </MemberShipCard>
  );
}

function AllShopItems({ creatorId }: { creatorId: string }) {
  const { data: items, isLoading } = api.shop.getCreatorShopAsset.useQuery({
    creatorId,
  });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="flex flex-col items-center">
      <p className="my-5 text-center text-3xl font-bold">Shop items</p>
      <div className="flex flex-col gap-2">
        {items?.map((item) => <ShopItem key={item.id} item={item} />)}
      </div>
    </div>
  );
}
