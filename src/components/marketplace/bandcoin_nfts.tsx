import React from "react";
import { api } from "~/utils/api";

export default function WallateNFTs() {
  const assets = api.wallate.asset.getAssets.useQuery();

  if (assets.isLoading) return <div>Loading...</div>;
  if (assets.isError) return <div>Error</div>;

  if (assets.data) {
    return (
      <div>
        {assets.data.map((asset) => {
          return <div key={asset.id}>{asset.codeIssuer}</div>;
        })}
      </div>
    );
  }
}
