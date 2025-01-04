import React from "react";
import About from "~/components/fan/creator/about";
import { CreatorBack } from ".";
import { api } from "~/utils/api";
import { CreatorWithSubscription, VanityURLManager } from "~/components/VanityURLManager";
import CreatorLayout from "./layout";

export default function CreatorSettings() {
  const creator = api.fan.creator.meCreator.useQuery();
  const subscription = api.fan.creator.vanitySubscription.useQuery();
  if (creator.data)
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center">
          <CreatorBack creator={creator.data} />
          <div className="flex flex-col items-center  gap-6">
            <VanityURLManager creator={subscription.data as CreatorWithSubscription} />
            <About creator={creator.data} />
          </div>
        </div>
      </CreatorLayout>
    );
}
