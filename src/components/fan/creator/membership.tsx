import React from "react";
import MemberShipCard from "./card";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import AddCreatorPageAssetModal from "./add-createpage-asset";
import { SubscriptionGridWrapper } from "~/pages/fans/creator/[id]";
import AddTierModal from "./add-tier-modal";
import Loading from "~/components/wallete/loading";

export default function MemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptions, isLoading } =
    api.fan.member.getAllMembership.useQuery();

  return (
    <div className="my-7 flex flex-col items-center">
      <CreatorAssetView creator={creator} />
      {subscriptions && subscriptions?.length < 3 && creator.pageAssetId && (
        <div className="fixed bottom-10 right-0 p-4 ">
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

function CreatorAssetView({ creator }: { creator: Creator }) {
  const creatorData = api.fan.creator.getCreator.useQuery(
    {
      id: creator.id,
    },
    { refetchOnWindowFocus: false },
  );

  if (creatorData.isLoading) return <Loading />;

  const pageAsset = creatorData.data?.pageAsset;

  if (pageAsset) return <p>{pageAsset.code}</p>;
  else return <AddCreatorPageAssetModal creator={creator} />;
}
