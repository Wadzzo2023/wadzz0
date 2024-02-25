/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import type { Tag } from "~/lib/wallate/interfaces";
import { useSearchTagStore } from "~/lib/state/wallete/search_tag";
import { useMyAssetOpenStore } from "~/lib/state/wallete/my_asset_open";
import MyAsset from "./my_asset";
import AllAsset from "./all_asset";
import { useAssetLoadingStore } from "~/lib/state/wallete/asset_loading";

import AllTags from "./all_tags";
import MyTags from "./my_tags";

import { useMyTagStore } from "~/lib/state/wallete/my_tag_state";
import { useSearchOpenStore } from "~/lib/state/wallete/searchOpen";
import { useMySearchArrayStore } from "~/lib/state/wallete/my_search_array";
import { useTagsResetKeyStore } from "~/lib/state/wallete/tags_reset_key";
import { useConnectWalletStateStore } from "package/connect_wallet";

interface MainProps {
  key?: React.Key;
  tags: Tag[];
}

function Main({ tags }: MainProps) {
  return (
    <div className="h-full space-y-2 tracking-wider">
      {/* {usoStore.open && <SearchBar />} */}
      {/* {mtStore.isOpen ? <MyTags /> : <AllTags key={String(utrkStore.open)} />} */}
      <div className="h-full space-y-2">
        {/* <p className="mx-2 flex items-center gap-2 ">
          Asset: {stStore.name ? `${stStore.name} ${stStore.value}` : ""}{" "}
          {loading && <span className="loading loading-xs" />}
        </p> */}
        <p>search asset</p>

        <MyAsset />

        <AllAsset />
      </div>
    </div>
  );
}

export default Main;
