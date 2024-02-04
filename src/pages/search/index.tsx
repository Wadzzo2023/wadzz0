import clsx from "clsx";
import React, { useState } from "react";
import { SearchMenu, useSearchMenu } from "~/lib/state/search-menu";
import { api } from "~/utils/api";

export default function Search() {
  const [inputText, setinpuText] = useState("");
  const { setSearchString } = useSearchMenu();

  return (
    <div>
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
    <div>
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
    <div>
      <h1>Posts</h1>
      {posts.isLoading && <div>Loading...</div>}
      {posts.data?.map((post) => {
        return <p key={post.id}>{post.content}</p>;
      })}
    </div>
  );
}

function Creator() {
  const { searchString } = useSearchMenu();
  const creators = api.creator.search.useQuery(searchString);
  return (
    <div>
      <h2>Creator</h2>
      {creators.isLoading && <div>Loading...</div>}
      {creators.data?.map((creator) => <p key={creator.id}>{creator.name}</p>)}
    </div>
  );
}

function AssetsList() {
  const { searchString } = useSearchMenu();
  const assets = api.shop.search.useQuery(searchString);
  return (
    <div>
      <h2>Assets</h2>
      {assets.isLoading && <div>Loading...</div>}
      {assets.data?.map((asset) => <p key={asset.id}>{asset.name}</p>)}
    </div>
  );
}
