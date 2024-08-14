import React from "react";
import MemberShipCard from "./card";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import AddCreatorPageAssetModal from "./add-createpage-asset";
import { SubscriptionGridWrapper } from "~/pages/fans/creator/[id]";
import AddTierModal from "./add-tier-modal";
import Loading from "~/components/wallete/loading";
import ReceiveCustomAssetModal from "./page_asset/custom_asset_recieve_modal";
import { z } from "zod";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";

export default function MemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptions, isLoading } =
    api.fan.member.getAllMembership.useQuery();

  const pageAsset = api.fan.creator.getCreatorPageAsset.useQuery();

  // console.log(creator.pageAssetId, creator.pageAsset);

  return (
    <div className="my-7 flex flex-col items-center">
      <AssetViewCart creator={creator} />
      {subscriptions && subscriptions?.length < 3 && pageAsset.data && (
        <div className="fixed bottom-10 right-0 p-4 lg:bottom-0 lg:right-80">
          <AddTierModal creator={creator} />
        </div>
      )}
      <SubscriptionGridWrapper itemLength={subscriptions?.length ?? 1}>
        {subscriptions?.map((el) => (
          <MemberShipCard key={el.id} creator={creator} subscription={el} />
        ))}
      </SubscriptionGridWrapper>
    </div>
  );
}

function AssetViewCart({ creator }: { creator: Creator }) {
  return (
    <Card className="w-[350px] text-center">
      <CardHeader>
        <CardTitle>Your Page Asset</CardTitle>
        {/* <CardDescription></CardDescription> */}
      </CardHeader>
      <CardContent>
        <CreatorAssetView creator={creator} />
      </CardContent>
    </Card>
  );
}

function CreatorAssetView({ creator }: { creator: Creator }) {
  const creatorData = api.fan.creator.getCreator.useQuery(
    {
      id: creator.id,
    },
    { refetchOnWindowFocus: false },
  );

  if (creatorData.isLoading) return <Loading />;

  const pageAsset = creatorData.data?.pageAsset;
  const customAssetIssuer = creatorData.data?.customPageAssetCodeIssuer;

  if (creatorData.data?.storagePub && customAssetIssuer) {
    const [code, issuer] = customAssetIssuer.split("-");
    const assetIssuer = z.string().length(56).safeParse(issuer);
    if (assetIssuer.success && code)
      return (
        <div>
          <p className="badge badge-secondary  my-4 py-4 font-bold">{code}</p>
          <PageAssetBalance />
          <ReceiveCustomAssetModal
            asset={code}
            issuer={assetIssuer.data}
            pubkey={creatorData.data.storagePub}
          />
        </div>
      );
    else {
      return <p>Issuer is invalid</p>;
    }
  }

  if (pageAsset)
    return (
      <div>
        <p className="badge badge-secondary  my-4 py-4 font-bold">
          {pageAsset.code}
        </p>
        <PageAssetBalance />
      </div>
    );
  else return <AddCreatorPageAssetModal creator={creator} />;
}

function PageAssetBalance() {
  const bal = api.fan.creator.getCreatorPageAssetBalance.useQuery();
  if (bal.isLoading) return <p>Loading...</p>;

  if (bal.error) return <p>{bal.error.message}</p>;

  if (bal.data)
    return (
      <p>
        You have {bal.data.balance} {bal.data.asset}
      </p>
    );
}
