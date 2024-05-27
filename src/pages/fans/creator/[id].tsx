import { Creator, Subscription } from "@prisma/client";
import clsx from "clsx";
import { useRouter } from "next/router";
import { clientsign } from "package/connect_wallet";
import React from "react";
import toast from "react-hot-toast";
import MemberShipCard from "~/components/fan/creator/card";
import { PostCard } from "~/components/fan/creator/post";
import {
  CreatorProfileMenu,
  useCreatorProfileMenu,
} from "~/lib/state/fan/creator-profile-menu";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
// import { ShopItem } from "~/components/fan/creator/shop";
import { useSession } from "next-auth/react";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { CreatorBack } from "~/pages/fans/creator";

export default function CreatorPage() {
  const router = useRouter();
  const creatorId = router.query.id;

  if (typeof creatorId == "string" && creatorId.length === 56) {
    return <CreatorPageView creatorId={creatorId} />;
  }

  return <div>Error</div>;
}

function CreatorPageView({ creatorId }: { creatorId: string }) {
  const { data: creator } = api.fan.creator.getCreator.useQuery({
    id: creatorId,
  });
  if (creator)
    return (
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center pb-48">
          <>
            <CreatorBack creator={creator} />
            <div className="my-2">
              <FollowButton creator={creator} />
              {creator.pageAsset && (
                <UserCreatorBalance
                  code={creator.pageAsset?.code}
                  issuer={creator.pageAsset?.issuer}
                />
              )}
            </div>

            <ChooseMemberShip creator={creator} />

            <Tabs />
            <RenderTabs creatorId={creatorId} />
          </>
        </div>
      </div>
    );
}

function CreatorPosts({ creatorId }: { creatorId: string }) {
  const { data, isLoading, error } = api.fan.post.getPosts.useInfiniteQuery(
    {
      pubkey: creatorId,
      limit: 10,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  if (data.pages.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {data.pages.map((page) =>
          page.posts.map((el) => (
            <PostCard
              priority={1}
              comments={el._count.comments}
              creator={el.creator}
              like={el._count.likes}
              key={el.id}
              post={el}
              show={(() => {
                if (el.subscription == null) return true;
                if (el.subscription) {
                  return el.subscription.price <= 10;
                }
              })()}
            />
          )),
        )}
      </div>
    );
  } else {
    return <p>No post</p>;
  }
}

function RenderTabs({ creatorId }: { creatorId: string }) {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  switch (selectedMenu) {
    case CreatorProfileMenu.Contents:
      return <CreatorPosts creatorId={creatorId} />;
    case CreatorProfileMenu.Shop:
    // return <AllShopItems creatorId={creatorId} />;
  }
}

function Tabs() {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {Object.values(CreatorProfileMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}

function UserCreatorBalance({
  code,
  issuer,
}: {
  code: string;
  issuer: string;
}) {
  const { getAssetBalance } = useUserStellarAcc();

  const bal = getAssetBalance({ code, issuer });

  if (bal)
    return (
      <p>
        You have {bal} {code}
      </p>
    );
}

export function FollowButton({ creator }: { creator: Creator }) {
  const session = useSession();
  const { needSign } = useNeedSign();
  const [signLoading, setSingLoading] = React.useState(false);

  const isFollower = api.fan.member.isFollower.useQuery({
    creatorId: creator.id,
  });
  const follow = api.fan.member.followCreator.useMutation({
    onSuccess: () => toast.success("Followed"),
  });
  const followXDR = api.fan.trx.followCreatorTRX.useMutation({
    onSuccess: async (xdr) => {
      if (xdr) {
        setSingLoading(true);
        try {
          const res = await clientsign({
            presignedxdr: xdr,
            pubkey: session.data?.user.id,
            walletType: session.data?.user.walletType,
            test: clientSelect(),
          });

          if (res) {
            follow.mutate({ creatorId: creator.id });
          } else toast.error("signing failed");
        } catch (e) {
          toast.error("Error in signing");
          console.error(e);
        } finally {
          setSingLoading(false);
        }
      } else {
        toast.error("XDR undefined");
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const loading = followXDR.isLoading || signLoading || follow.isLoading;
  if (isFollower.data) return <p>You are a follower</p>;
  else
    return (
      <div>
        <button
          disabled={loading}
          className="btn btn-secondary"
          onClick={() =>
            followXDR.mutate({ creatorId: creator.id, signWith: needSign() })
          }
        >
          {loading && <span className="loading loading-spinner"></span>}
          Follow
        </button>
      </div>
    );
}

export function ChooseMemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptonModel, isLoading } =
    api.fan.member.getCreatorMembership.useQuery(creator.id);

  if (subscriptonModel && subscriptonModel.length > 0) {
    return (
      <div className="mb-10 flex flex-col gap-4">
        <h2 className="text-center text-2xl font-bold">Your Tier</h2>
        {isLoading && <div>Loading...</div>}

        <SubscriptionGridWrapper itemLength={subscriptonModel.length}>
          {subscriptonModel
            ?.sort((a, b) => a.price - b.price)
            .map((el, i) => (
              <SubscriptionCard
                priority={i + 1}
                key={el.id}
                creator={creator}
                subscription={el}
              />
            ))}
        </SubscriptionGridWrapper>
      </div>
    );
  }
}

export function SubscriptionGridWrapper({
  children,
  itemLength,
}: {
  children: React.ReactNode;
  itemLength: number;
}) {
  function getGridColNumber(element: number) {
    if (element === 1) {
      return "grid-cols-1";
    }
    if (element === 2) {
      return "gird-cols-1 sm:grid-cols-2";
    }
    if (element === 3) {
      return "gird-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  }
  return (
    <div
      className={clsx(
        "grid   justify-items-center gap-2  ",
        getGridColNumber(itemLength),
      )}
    >
      {children}
    </div>
  );
}

export type SubscriptionType = Omit<Subscription, "issuerPrivate">;

function SubscriptionCard({
  subscription,
  creator,
  priority,
}: {
  subscription: SubscriptionType;
  creator: Creator;
  priority?: number;
}) {
  return (
    <MemberShipCard
      key={subscription.id}
      className=" bg-neutral text-neutral-content"
      creator={creator}
      priority={priority}
      subscription={subscription}
    >
      <TierCompleted subscription={subscription} />
    </MemberShipCard>
  );
}

function TierCompleted({ subscription }: { subscription: SubscriptionType }) {
  const { getAssetBalance } = useUserStellarAcc();

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();
  const asset = api.fan.asset.getCreatorAsset.useQuery({
    creatorId: subscription.creatorId,
  });

  if (accBalances.data && asset.data) {
    const { code, issuer } = asset.data;

    const bal = getAssetBalance({ code, issuer });
    if (bal) {
      if (Number(bal) >= subscription.price) {
        return <div className="btn btn-warning">Completed</div>;
      }
    }
  }
}
