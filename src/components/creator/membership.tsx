import React from "react";
import MemberShipCard from "./card";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import AddTierModal from "./add-tier-modal";

export default function MemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptions, isLoading } =
    api.member.getAllMembership.useQuery();
  return (
    <div className="flex flex-col items-center">
      <p className="text-2xl font-bold">MemberShip </p>
      <div className="fixed bottom-0 right-0 p-4">
        <AddTierModal creator={creator} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {subscriptions?.map((el) => (
          <MemberShipCard key={el.id} creator={creator} subscription={el} />
        ))}
      </div>
    </div>
  );
}
