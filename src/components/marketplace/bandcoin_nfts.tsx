import React from "react";
import { api } from "~/utils/api";
import AllAsset from "../wallete/all_asset";

export default function WallateNFTs() {
  return <AllAsset />;
  // const assets = api.wallate.asset.getAssets.useQuery();

  // if (assets.isLoading) return <div>Loading...</div>;
  // if (assets.isError) return <div>Error</div>;

  // if (assets.data) {
  //   return (
  //     <div>
  //       {assets.data.map((asset) => {
  //         return <div key={asset.id}>{asset.codeIssuer}</div>;
  //       })}
  //     </div>
  //   );
  // }
}
