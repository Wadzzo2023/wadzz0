import React from "react";
import NftCreate from "~/components/marketplace/nft_create";
import AlbumCreate from "~/components/music/modal/album_create";
import { ModalMode } from "~/components/music/modal/modal_template";
import MintedItemAdd from "~/components/wallete/add_asset_form";
import { api } from "~/utils/api";

export default function AdminPage() {
  return <IsAdmin />;
}

function AdminPageTemplate() {
  return (
    <div>
      <AlbumCreate mode={ModalMode.ADD} />
      <NftCreate admin />
      <div className="max-w-xl">
        <MintedItemAdd />
      </div>
    </div>
  );
}
function IsAdmin() {
  const admin = api.wallate.admin.checkAdmin.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  if (admin.isLoading) return <div>Checking..</div>;
  if (admin.data) {
    return <AdminPageTemplate />;
  } else {
    return <CreateAdmin />;
  }
}

function CreateAdmin() {
  const makeAdmin = api.wallate.admin.makeMeAdmin.useMutation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 ">
      <p className="text-2xl font-bold">You are not a Admin</p>
      <button className="btn btn-primary" onClick={() => makeAdmin.mutate()}>
        {makeAdmin.isLoading && <span className="loading loading-spinner" />}
        Be a Admin
      </button>
    </div>
  );
}
