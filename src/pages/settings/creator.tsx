import React from "react";
import About from "~/components/fan/creator/about";
import { CreatorBack } from "../me/creator";
import { api } from "~/utils/api";

export default function CreatorSettings() {
  const creator = api.creator.meCreator.useQuery();

  if (creator.data)
    return (
      <div className="flex flex-col items-center justify-center">
        <CreatorBack creator={creator.data} />
        <div className="flex flex-1 items-center pb-20">
          <About creator={creator.data} />
        </div>
      </div>
    );
}
