import React from "react";
import { Creator, Subscription } from "@prisma/client";
import clsx from "clsx";
import EditTierModal from "./edit-tier-modal";
import { SubscriptionType } from "~/pages/fans/creator/[id]";
import { Preview } from "~/components/preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/shadcn/ui/card";

export default function MemberShipCard({
  creator,
  subscription,
  className,
  children,
  priority,
  pageAsset,
}: {
  creator: Creator;
  subscription: SubscriptionType;
  className?: string;
  children?: React.ReactNode;
  priority?: number;
  pageAsset?: string;
}) {

  return (
    <Card className={`w-full rounded-md max-w-sm mt-4 ${className}`}>

      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{subscription.name}</CardTitle>
            <CardDescription className="text-sm font-medium">
              Requirement: <span className="text-lg font-bold">{subscription.price} {pageAsset}</span>
            </CardDescription>
          </div>
          <div className="bg-blue-gray-50 flex h-24 w-24 items-center justify-center rounded-full">
            <div
              className={clsx("badge  text-center", getBageStyle(priority))}
            ></div>
          </div>
        </div>
      </CardHeader>

      <div className="">{children}</div>
      <CardContent className="max-h-[300px] overflow-y-auto scrollbar-none">
        <p className="mb-2 font-bold tracking-wide">Features</p>
        <ul className="space-y-2">
          <li className="flex items-center">
            <div className="">
              <svg
                className="h-4 w-4 text-purple-600"
                viewBox="0 0 24 24"
                stroke-linecap="round"
                strokeWidth="2"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  points="6,12 10,16 18,8"
                ></polyline>
                <circle
                  cx="12"
                  cy="12"
                  fill="none"
                  r="11"
                  stroke="currentColor"
                ></circle>
              </svg>
            </div>
            <p className="font-medium text-gray-800">
              <Preview value={subscription.features} />
            </p>
            <EditTierModal item={subscription} />
          </li>
        </ul>
      </CardContent>

    </Card>
  );
}

export function getCardStyle(priority?: number) {
  if (!priority) return "bg-primary rounded-2xl";
  if (priority === 1) return "bg-primary rounded-e-2xl";
  if (priority === 2) return "bg-secondary rounded-2xl";
  if (priority === 3) return "bg-accent rounded-s-2xl";
}

export function getBageStyle(priority?: number) {
  if (!priority) return "badge-primary";
  if (priority === 1) return "badge-primary";
  if (priority === 2) return "badge-secondary";
  if (priority === 3) return "badge-accent";
}
export function getColor(priority?: number) {
  if (!priority) return "bg-primary";
  if (priority === 1) return "bg-primary";
  if (priority === 2) return "bg-secondary";
  if (priority === 3) return "bg-accent";
}
