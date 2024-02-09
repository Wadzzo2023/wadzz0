import React from "react";
import { api } from "~/utils/api";
import { getDaysLeft, getEndDay } from "~/utils/format-date";

export default function Memberships() {
  const subscriptions = api.member.getAllSubscription.useQuery();
  return (
    <div>
      <h2 className="text-2xl font-bold">Memberships</h2>

      {subscriptions.data?.map((el) => (
        <div key={el.id}>
          <p>{el.id}</p>
          <p>{el.createdAt.toString()}</p>
          <p>
            {getDaysLeft(getEndDay(el.createdAt, el.subscription.days))} days
            remains
          </p>
        </div>
      ))}
    </div>
  );
}
