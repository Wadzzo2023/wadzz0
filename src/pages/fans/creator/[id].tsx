import { Creator, Subscription } from "@prisma/client";
import clsx from "clsx";
import { useRouter } from "next/router";
import { clientsign } from "package/connect_wallet";
import React, { useState } from "react";
import toast from "react-hot-toast";
import MemberShipCard from "~/components/fan/creator/card";
import { PostCard } from "~/components/fan/creator/post";
import {
  CreatorProfileMenu,
  useCreatorProfileMenu,
} from "~/lib/state/fan/creator-profile-menu";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import ViewMediaModal from "~/components/fan/shop/asset_view_modal";
import ShopAssetComponent from "~/components/fan/shop/shop_asset";
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts";
import { Button } from "~/components/shadcn/ui/button";
import useNeedSign from "~/lib/hook";
import { useCreatorStorageAcc, useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { CreatorBack } from "~/pages/fans/creator";
import { CREATOR_TERM } from "~/utils/term";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog"
import { Input } from "~/components/shadcn/ui/input";
import { SubmitHandler, useForm } from "react-hook-form";
import { getAssetPriceByCoddenIssuer } from "~/lib/stellar/fan/get_token_price";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
type CreatorWithPageAsset = Creator & {
  pageAsset: {
    code: string; issuer: string,
    price: number
    priceUSD: number
  } | null
};
import {
  PaymentChoose,
  usePaymentMethodStore,
} from "~/components/payment/payment-options";
import { PLATFORM_FEE, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant";

export default function CreatorPage() {
  const router = useRouter();
  const creatorId = router.query.id;

  if (typeof creatorId == "string" && creatorId.length === 56) {
    return <CreatorPageView creatorId={creatorId} />;
  }

  return <div>Error</div>;
}

function CreatorPageView({ creatorId }: { creatorId: string }) {
  const { setBalance } =
    useCreatorStorageAcc();


  const acc = api.wallate.acc.getCreatorStorageBallancesByID.useQuery({
    creatorId: creatorId,
  }, {
    onSuccess: (data) => {
      setBalance(data);
    },
    onError: (error) => {
      console.log(error);
    },
    refetchOnWindowFocus: false,
    enabled: !!creatorId
  })

  const { data: creator } = api.fan.creator.getCreator.useQuery(
    {
      id: creatorId,
    },
    {
      enabled: creatorId.length === 56,
    },
  );


  let code: string | undefined;
  let issuer: string | undefined;

  if (creator?.customPageAssetCodeIssuer) {
    code = creator.customPageAssetCodeIssuer.split("-")[0];
    issuer = creator.customPageAssetCodeIssuer.split("-")[1];
  }

  if (creator)
    return (
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center ">
          <>
            <CreatorBack creator={creator} />
            <div className="my-2 flex flex-col items-center justify-center">
              <FollowButton creator={creator} />
              {creator.pageAsset ? (
                <UserCreatorBalance
                  code={creator.pageAsset?.code}
                  issuer={creator.pageAsset?.issuer}
                />
              ) : (
                creator.customPageAssetCodeIssuer &&
                code &&
                issuer && <UserCreatorBalance code={code} issuer={issuer} />
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

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();

  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;
  if (data.pages.length > 0) {
    return (
      <div className="flex w-full flex-col items-center gap-4 bg-base-100 p-2 md:container md:mx-auto">
        {data.pages[0]?.posts.length === 0 && (
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="text-lg font-semibold">No Post Found Yet!</p>
            </CardContent>
          </Card>
        )}

        {data.pages.map((page) =>
          page.posts.map((el) => (
            <PostCard
              priority={1}
              commentCount={el._count.comments}
              creator={el.creator}
              likeCount={el._count.likes}
              key={el.id}
              post={el}
              locked={el.subscription ? true : false}
              show={(() => {
                if (el.subscription) {
                  let pageAssetCode: string | undefined;
                  let pageAssetIssuer: string | undefined;
                  const customPageAsset = el.creator.customPageAssetCodeIssuer;
                  const pageAsset = el.creator.pageAsset;

                  if (pageAsset) {
                    pageAssetCode = pageAsset.code;
                    pageAssetIssuer = pageAsset.issuer;
                  } else {
                    if (customPageAsset) {
                      const [code, issuer] = customPageAsset.split("-");
                      pageAssetCode = code;
                      pageAssetIssuer = issuer;
                    }
                  }
                  const bal = getAssetBalanceFromBalance({
                    balances: accBalances.data,
                    code: pageAssetCode,
                    issuer: pageAssetIssuer,
                  });
                  if (el.subscription.price <= bal) {
                    return true;
                  }

                  return false;
                } else return true;
              })()}
              media={el.medias ? el.medias : []}
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
      return <CreatorStoreItem creatorId={creatorId} />;
  }
}

function Tabs() {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs my-5 w-1/2 ">
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
        if (xdr === true) {
          toast.success("User already has trust in page asset");
          follow.mutate({ creatorId: creator.id });
        } else {
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
            } else toast.error("Transaction failed while signing.");
          } catch (e) {
            toast.error("Transaction failed while signing.");
            console.error(e);
          } finally {
            setSingLoading(false);
          }
        }
      } else {
        toast.error("Can't get xdr");
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const loading = followXDR.isLoading || signLoading || follow.isLoading;
  // console.log("Session User, Creator", session.data?.user.id, creator.id);
  if (session.data?.user.id === creator.id) return <p>{CREATOR_TERM}</p>;
  if (isFollower.data ?? follow.isSuccess)
    return (
      <div className="flex flex-col justify-center p-2">
        <p className="text-center">You are a follower</p>
        <UnFollowButton creator={creator as CreatorWithPageAsset} />
      </div>
    );
  else if (isFollower.isSuccess || isFollower.data === undefined && !isFollower.isLoading)
    return (
      <div>
        <button
          disabled={loading}
          className="btn btn-primary"
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



export function UnFollowButton({ creator }: { creator: CreatorWithPageAsset }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { getAssetBalance } = useCreatorStorageAcc()
  const router = useRouter()
  const { needSign } = useNeedSign();
  const { isOpen, setIsOpen, paymentMethod } = usePaymentMethodStore();
  const [loading, setLoading] = useState(false)
  const session = useSession()

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm({

    defaultValues: {
      amount: 0,
    },
  })
  const totalFeees =
    Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);




  let code: string | undefined
  let issuer: string | undefined
  let price: number = 0
  let priceUSD: number = 0

  if (creator?.customPageAssetCodeIssuer) {
    [code, issuer] = creator.customPageAssetCodeIssuer.split("-")
    price = Number(creator.customPageAssetCodeIssuer.split("-")[2])
    priceUSD = Number(creator.customPageAssetCodeIssuer.split("-")[3])
  } else if (creator.pageAsset) {
    code = creator.pageAsset.code
    issuer = creator.pageAsset.issuer
    price = Number(creator.pageAsset.price)
    priceUSD = Number(creator.pageAsset.priceUSD)
  }

  const assetBalance = getAssetBalance({ code, issuer })



  const unFollow = api.fan.member.unFollowCreator.useMutation({
    onSuccess: async () => {
      toast.success("Unfollowed successfully")
      router.reload()
    },
    onError: (e) => toast.error(e.message),
  })

  const sendAssetToUser =
    api.fan.creator.getSendAssetXDR.useMutation({
      onSuccess: async (data) => {
        if (data) {
          try {
            setLoading(true);
            await clientsign({
              presignedxdr: data,
              walletType: session.data?.user?.walletType,
              pubkey: session.data?.user.id,
              test: clientSelect(),
            });
            setIsOpen(false);
          } catch (error) {
            setLoading(false);
            console.error(error);
            toast.success("Error sending asset to user");
          }
        }
      },
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
        setLoading(false);
        setIsOpen(false);
      },
    });

  const onSubmit = () => {
    if (!price || !code || !issuer) return toast.error("Invalid asset")
    sendAssetToUser.mutate({
      code: code,
      issuer: issuer,
      price: price + totalFeees,
      priceInXLM: (getPlatformAssetToXLM.data?.costInXLM ?? 0) + (getPlatformAssetToXLM.data?.priceInXLM ?? 0),
      creatorId: creator.id,
      signWith: needSign(),
      method: paymentMethod,

    })

    setIsDialogOpen(false)
  }
  const getPlatformAssetToXLM = api.marketplace.steller.getPlatformAssetToXLM.useQuery({
    price: price,
    cost: totalFeees
  })

  return (
    <div className="flex gap-2">
      <Button
        disabled={unFollow.isLoading}
        onClick={() => {
          unFollow.mutate({ creatorId: creator.id })
        }}
      >
        {unFollow.isLoading && <Loader2 className="animate mr-2 animate-spin" />} UNFOLLOW
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {
          assetBalance && assetBalance > 0 ? (
            <DialogTrigger asChild>
              <Button>BUY {code}</Button>
            </DialogTrigger>
          ) : null
        }
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Buy {code}</DialogTitle>
          </DialogHeader>

          <div className="text-lg">
            Creator has total{" "}
            <span className="font-bold">
              {assetBalance} {code}
            </span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>

            <DialogFooter>
              <div className="flex w-full flex-col gap-2">
                <PaymentChoose
                  costBreakdown={[
                    {
                      label: "Cost",
                      amount: paymentMethod === "asset" ? price : getPlatformAssetToXLM.data?.priceInXLM ?? 0,
                      highlighted: true,
                      type: "cost",
                    },
                    {
                      label: "Platform Fee",
                      amount: paymentMethod === "asset" ? totalFeees : getPlatformAssetToXLM.data?.costInXLM ?? 0,
                      highlighted: false,
                      type: "fee",
                    },
                    {
                      label: "Total Cost",
                      amount: paymentMethod === "asset" ? price + totalFeees : (getPlatformAssetToXLM.data?.costInXLM ?? 0) + (getPlatformAssetToXLM.data?.priceInXLM ?? 0),
                      highlighted: false,
                      type: "total",
                    },
                  ]}
                  loading={unFollow.isLoading}
                  XLM_EQUIVALENT={(getPlatformAssetToXLM.data?.costInXLM ?? 0) + (getPlatformAssetToXLM.data?.priceInXLM ?? 0)}
                  handleConfirm={handleSubmit(onSubmit)}
                  requiredToken={price + totalFeees}
                  trigger={
                    <Button
                      className="w-full"
                    >
                      Buy {code}
                    </Button>
                  }
                />
              </div>
              <Button
                variant={'secondary'}
                className="w-full"
                onClick={() => setIsDialogOpen(false)}
              >Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}



export function ChooseMemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptonModel, isLoading } =
    api.fan.member.getCreatorMembership.useQuery(creator.id);

  if (subscriptonModel && subscriptonModel.length > 0) {
    return (
      <div className="mb-10 flex flex-col gap-4">
        <h2 className="text-center text-2xl font-bold">{CREATOR_TERM} Tiers</h2>
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
                pageAsset={el.creator.pageAsset?.code}
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
        "grid   justify-center gap-2  ",
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
  pageAsset,
}: {
  subscription: SubscriptionType;
  creator: Creator;
  priority?: number;
  pageAsset?: string;
}) {
  return (
    <MemberShipCard
      key={subscription.id}
      creator={creator}
      priority={priority}
      subscription={subscription}
      pageAsset={pageAsset}
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

function CreatorStoreItem({ creatorId }: { creatorId: string }) {
  const assets =
    api.marketplace.market.getCreatorNftsByCreatorID.useInfiniteQuery(
      { limit: 10, creatorId: creatorId },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  if (assets.isLoading)
    return (
      <MoreAssetsSkeleton className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />
    );

  if (assets.data?.pages[0]?.nfts.length === 0) {
    return <div>No assets</div>;
  }

  if (assets.data) {
    return (
      <div className="p-2">
        <div
          style={{
            scrollbarGutter: "stable",
          }}
          className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5"
        >
          {assets.data.pages.map((page) =>
            page.nfts.map((item, i) => (
              <ShopAssetComponent key={i} item={item} />
            )),
          )}
        </div>
        {assets.hasNextPage && (
          <button
            className="btn btn-outline btn-primary"
            onClick={() => void assets.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    );
  }
}
