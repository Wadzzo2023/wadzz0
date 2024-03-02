import React from "react";
import MemberShipCard from "./card";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import AddTierModal from "./add-tier-modal";
import EditTierModal from "./edit-tier-modal";
import { SubscriptionGridWrapper } from "~/pages/fans/creator/[id]";

export default function MemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptions, isLoading } =
    api.fan.member.getAllMembership.useQuery();
  return (
    <div className="my-7 flex flex-col items-center">
      {/* <p className="text-2xl font-bold">MemberShip </p> */}
      {subscriptions && subscriptions?.length < 3 && (
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
