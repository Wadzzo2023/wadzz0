import clsx from "clsx";
import Link from "next/link";
import React, { useState } from "react";
import Avater from "~/components/ui/avater";
import { SearchMenu, useSearchMenu } from "~/lib/state/search-menu";
import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";

export default function Search() {
  const [inputText, setinpuText] = useState("");
  const { setSearchString } = useSearchMenu();

  return (
    <div className="my-10 flex flex-col items-center gap-4">
      <h2 className="text mb-5 text-2xl font-bold">Find Something Here</h2>
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered w-full max-w-xs"
          onChange={(e) => setinpuText(e.currentTarget.value)}
        />
        <button className="btn" onClick={() => setSearchString(inputText)}>
          Search
        </button>
      </div>
      <Tabs />
      <ConditionallyRenderSearch />
    </div>
  );
}

function Tabs() {
  const { selectedMenu, setSelectedMenu } = useSearchMenu();
  return (
    <div role="tablist" className="tabs tabs-bordered">
      {Object.values(SearchMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx("tab", selectedMenu == key && "tab-active")}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}

function ConditionallyRenderSearch() {
  const { selectedMenu } = useSearchMenu();
  return (
    <div className="w-full">
      {selectedMenu === SearchMenu.Post && <Posts />}
      {selectedMenu === SearchMenu.Creator && <Creator />}
      {selectedMenu === SearchMenu.Asset && <AssetsList />}
    </div>
  );
}

function Posts() {
  const { searchString } = useSearchMenu();
  const posts = api.post.search.useQuery(searchString);
  return (
    <div className="flex flex-col items-center">
      {posts.isLoading && <div>Loading...</div>}
      {/* < className="flex flex-col gap-4"> */}
      <div className="max-w-sm rounded-box bg-base-200 p-2">
        {posts.data?.map((post) => {
          return (
            <div className="p-4 hover:bg-neutral">
              <Link href={`/posts/${post.id}`} className="">
                <h2 className="text-lg font-bold">{post.heading}</h2>
                <p key={post.id}>{post.content}</p>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Creator() {
  const { searchString } = useSearchMenu();
  const creators = api.creator.search.useQuery(searchString);
  return (
    <div className="flex flex-col items-center">
      <h2>Creator</h2>
      {creators.isLoading && <div>Loading...</div>}
      <div className="flex max-w-sm flex-col rounded-box bg-base-200 p-4">
        {creators.data?.map((creator) => <CreatorAvater creator={creator} />)}
      </div>
    </div>
  );
}

export function CreatorAvater({
  creator,
}: {
  creator: { id: string; bio: string | null; name: string };
}) {
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-neutral">
      <div>
        <Avater />
      </div>
      <div>
        <Link href={`/creator/${creator.id}`} className="font-bold">
          {creator.name}
        </Link>
        <p className="text-sm">{creator.bio?.slice(0, 30)}</p>
      </div>
    </div>
  );
}
function AssetsList() {
  const { searchString } = useSearchMenu();
  const assets = api.shop.search.useQuery(searchString);
  return (
    <div className="flex flex-col items-center">
      <h2>Assets</h2>
      {assets.isLoading && <div>Loading...</div>}
      <div className="w-full max-w-xs rounded-box bg-base-200 p-4">
        {assets.data?.map((asset) => (
          <div key={asset.id} className="p-4 hover:bg-neutral">
            <p>{asset.asset.code}</p>
            <p>{truncateString(asset.asset.issuer, 15, 5)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
