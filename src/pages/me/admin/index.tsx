import React from "react";
import NftCreate from "~/components/marketplace/nft_create";
import AlbumCreate from "~/components/music/modal/album_create";
import { ModalMode } from "~/components/music/modal/modal_template";
import MintedItemAdd from "~/components/wallete/add_asset_form";

export default function AdminPage() {
  return (
    <div>
      <AlbumCreate mode={ModalMode.ADD} />
      <NftCreate />
      <div className="max-w-xl">
        <MintedItemAdd />
      </div>
    </div>
  );
}
