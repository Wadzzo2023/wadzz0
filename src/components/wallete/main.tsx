/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import type { Tag } from "~/lib/wallate/interfaces";
import MyAsset from "./my_asset";
import AllAsset from "./all_asset";



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
