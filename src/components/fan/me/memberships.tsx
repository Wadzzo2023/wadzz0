import React from "react";
import { api } from "~/utils/api";
import { getDaysLeft, getEndDay } from "~/utils/format-date";
import Avater from "../../ui/avater";
import { truncateString } from "~/utils/string";

export default function Memberships() {
  const subscriptions = api.fan.member.getUserSubcribed.useQuery();
  return (
    <div className="my-5">
      {/* <h2 className="mb-5 text-center text-2xl font-bold">Memberships</h2> */}

      {subscriptions.data?.map((el) => (
        <div key={el.id} className="card w-96 bg-base-100">
          <div className="card-body">
            <div className="flex items-center gap-2">
              <div>
                <Avater
                  url={el.subscription.creator.profileUrl}
                  className="w-8"
                />
              </div>
              <div>
                <h2 className="card-title">{el.subscription.creator.name}</h2>
                <p className="text-sm">
                  {truncateString(el.subscription.creator.id, 10, 3)}
                </p>
              </div>
            </div>
            {/* <h2 className="btn btn-outline btn-primary card-title">
              {el.subscription.asset.code}
            </h2> */}

            <p>
              {/* {getDaysLeft(getEndDay(el.createdAt, el.subscription.days))} days */}
              remains
            </p>
            <div className="card-actions">
              {/* <button className="btn btn-primary">Click</button> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
