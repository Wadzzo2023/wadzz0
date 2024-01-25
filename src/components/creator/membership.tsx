import React from "react";
import MemberShipCard from "./card";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import AddTierModal from "./add-tier-modal";

export default function MemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptions, isLoading } =
    api.member.getAllMembership.useQuery(creator.id);
  return (
    <div className="flex flex-col items-center">
      <p className="text-2xl font-bold">MemberShip </p>
      <AddTierModal creator={creator} />
      <div className="mt-4 flex flex-col gap-2">
        {subscriptions?.map((el) => (
          <MemberShipCard key={el.id} creator={creator} subscription={el} />
        ))}
      </div>
    </div>
  );
}
