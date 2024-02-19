import React from "react";
import MemberShipCard from "./card";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import AddTierModal from "./add-tier-modal";
import { SubscriptionGridWrapper } from "~/pages/creator/[id]";
import EditTierModal from "./edit-tier-modal";

export default function MemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptions, isLoading } =
    api.member.getAllMembership.useQuery();
  return (
    <div className="my-7 flex flex-col items-center">
      {/* <p className="text-2xl font-bold">MemberShip </p> */}
      {subscriptions && subscriptions?.length < 3 && (
        <div className="fixed bottom-14 right-0 p-4 sm:bottom-0">
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
