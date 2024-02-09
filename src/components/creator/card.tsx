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
    <div
      className={clsx(
        "card w-48  bg-neutral text-neutral-content shadow-xl",
        className,
      )}
    >
      <div className="card-body">
        <h2 className="card-title">
          <h2 className="badge badge-secondary text-center">
            {subscription.priority}
          </h2>
          ${subscription.id}/{subscription.days} days
        </h2>
        <p>{subscription.features}</p>
        {children}
      </div>
    </div>
  );
}
