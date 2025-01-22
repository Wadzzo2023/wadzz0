import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { CreatorBack } from "./fans/creator";
import { ChooseMemberShip, FollowButton } from "./fans/creator/[id]";
import { useCreatorStorageAcc, useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import {
  CreatorProfileMenu,
  useCreatorProfileMenu,
} from "~/lib/state/fan/creator-profile-menu";
import clsx from "clsx";
import { PostCard } from "~/components/fan/creator/post";
import { MoreAssetsSkeleton } from "~/components/marketplace/platforms_nfts";
import ViewMediaModal from "~/components/fan/shop/asset_view_modal";
import ShopAssetComponent from "~/components/fan/shop/shop_asset";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/shadcn/ui/button";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";

const VanityCreator = () => {
  const router = useRouter();
  const { vanityURL } = router.query as { vanityURL: string };
  const { data, isLoading, error } =
    api.admin.creator.creatorIDfromVanityURL.useQuery(vanityURL);




  if (isLoading) {
    return (
      <Card className="mx-auto mt-8 w-full max-w-2xl">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error ?? !data ?? !data.vanitySubscription) {
    return (
      <Card className="mx-auto mt-8 w-full max-w-2xl ">
        <CardHeader></CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className=" flex w-full items-center justify-center bg-background">
            <div className="w-full max-w-md p-6 text-center">
              <h1 className="mb-2 text-4xl font-bold">Oops!</h1>
              <div className="mb-8 whitespace-pre font-mono text-4xl">
                {`(╯°□°)╯︵ ┻━┻`}
              </div>
              <h2 className="mb-2 text-xl">
                Error 404: Page/Creator Not Found.
              </h2>
              <p className="mb-8 text-muted-foreground">
                We couldn{"'"}t find a creator with this vanity URL.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.push("/")}>
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (
    data.vanitySubscription &&
    data?.vanitySubscription?.endDate < new Date()
  ) {
    return (
      <Card className="mx-auto mt-8 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Creator Subscription Expired
          </CardTitle>
          <CardDescription>
            The creator{"'"}s subscription has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-16 w-16 text-yellow-500" />
          <p className="text-center text-gray-600">
            The creator you{"'"}re looking for has an expired subscription.
          </p>
          <Link href="/fans/home" passHref>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Artist
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <CreatorPageView creatorId={data.id} />;
};
function CreatorPageView({ creatorId }: { creatorId: string }) {
  const { data: creator } = api.fan.creator.getCreator.useQuery({
    id: creatorId,
  });
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
  if (creator)
    return (
      <div className="container mx-auto flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center ">
          <>
            <CreatorBack creator={creator} />
            <div className="my-2 flex flex-col items-center justify-center">
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

function RenderTabs({ creatorId }: { creatorId: string }) {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  switch (selectedMenu) {
    case CreatorProfileMenu.Contents:
      return <CreatorPosts creatorId={creatorId} />;
    case CreatorProfileMenu.Shop:
      return <CreatorStoreItem creatorId={creatorId} />;
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
      <MoreAssetsSkeleton className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5" />
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

function CreatorPosts({ creatorId }: { creatorId: string }) {
  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();
  const { data, isLoading, error } = api.fan.post.getPosts.useInfiniteQuery(
    {
      pubkey: creatorId,
      limit: 10,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;
  if (data.pages.length > 0) {
    return (
      <div className="flex w-full flex-col items-center gap-4 bg-base-100 p-2 md:container md:mx-auto">
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
                  const customPageAsset =
                    el.creator.customPageAssetCodeIssuer;
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
export default VanityCreator;
