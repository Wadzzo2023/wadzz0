import { useRouter } from "next/router";
import React from "react";
import { CreatorAvater } from "~/pages/search";
import { api } from "~/utils/api";

export default function RightBar() {
  const router = useRouter();
  if (router.pathname == "/")
    return (
      <div className="w-60">
        <AllCreators />
      </div>
    );
}
function AllCreators() {
  const { data: creators } = api.creator.getAllCreator.useQuery();

  return (
    <div className="flex h-screen w-full flex-col items-center gap-4  bg-base-300 pt-5 ">
      <p className="text-center text-2xl text-white">All creators</p>
      <ul>
        {creators?.map((creator) => (
          <li key={creator.id}>
            <CreatorAvater creator={creator} />
          </li>
        ))}
      </ul>
    </div>
  );
}
