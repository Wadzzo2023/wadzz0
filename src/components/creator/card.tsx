import React from "react";
import AddTierModal from "./add-tier-modal";
import { Creator, Subscription } from "@prisma/client";

export default function MemberShipCard({
  creator,
  subscription,
}: {
  creator: Creator;
  subscription: Subscription;
}) {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">$1/{subscription.days}</h2>
        <p>{subscription.features}</p>
        <div className="card-actions justify-end">
          <AddTierModal creator={creator} />
        </div>
      </div>
    </div>
  );
}
