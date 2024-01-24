import React from "react";
import AddTierModal from "./add-tier-modal";
import { Creator, Subscription } from "@prisma/client";
import clsx from "clsx";

export default function MemberShipCard({
  creator,
  subscription,
  className,
  children,
}: {
  creator: Creator;
  subscription: Subscription;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={clsx("card w-96 bg-base-100 shadow-xl", className)}>
      <div className="card-body">
        <h2 className="card-title">
          ${subscription.id}/{subscription.days}
        </h2>
        <p>{subscription.features}</p>
        {children}
      </div>
    </div>
  );
}
