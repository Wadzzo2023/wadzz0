import React from "react";
import AddTierModal from "./add-tier-modal";
import { Creator, Subscription } from "@prisma/client";
import clsx from "clsx";
import EditTierModal from "./edit-tier-modal";

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
    <div className={clsx("card w-48 bg-base-100  pb-10 shadow-xl", className)}>
      <div className={clsx("h-20  ", getCardStyle(subscription.priority))}>
        <EditTierModal item={subscription} />
      </div>
      <div className="card-body p-2">
        <div className="card-title">
          <div className="flex w-full justify-between">
            <h2 className="text-2xl font-bold">
              {subscription.name.toLocaleUpperCase()}
            </h2>
            <div
              className={clsx(
                "badge  text-center",
                getBageStyle(subscription.priority),
              )}
            >
              {subscription.priority}
            </div>
          </div>
        </div>
        <h2 className=" text-2xl">
          {subscription.price}A/
          <span className="text-base">{subscription.days} days</span>
        </h2>
        <div className="">{children}</div>
        <div className="py-4">
          <h4 className="text-lg font-bold">Include</h4>
          <p>{subscription.features}</p>
        </div>
      </div>
    </div>
  );
}

export function getCardStyle(priority: number) {
  if (priority === 1) return "bg-primary rounded-e-2xl";
  if (priority === 2) return "bg-secondary rounded-2xl";
  if (priority === 3) return "bg-accent rounded-s-2xl";
}

export function getBageStyle(priority: number) {
  if (priority === 1) return "badge-primary";
  if (priority === 2) return "badge-secondary";
  if (priority === 3) return "badge-accent";
}
export function getColor(priority: number) {
  if (priority === 1) return "primary";
  if (priority === 2) return "secondary";
  if (priority === 3) return "accent";
}
