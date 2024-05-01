import React from "react";
import AddAdmin from "~/components/admin/add_admin";
import AdminsList from "~/components/admin/admins";
import NftCreate from "~/components/marketplace/nft_create";
import AlbumCreate from "~/components/music/modal/album_create";
import { ModalMode } from "~/components/music/modal/modal_template";
import MintedItemAdd from "~/components/wallete/add_asset_form";
import { AdminNavigation, useAdminMenu } from "~/lib/state/admin-tab-menu";
import { api } from "~/utils/api";

export default function AdminPage() {
  return <IsAdmin />;
}

function AdminPageTemplate() {
  return (
    <div>
      <RenderTabs />
    </div>
  );
}

function RenderTabs() {
  const { selectedMenu } = useAdminMenu();

  switch (selectedMenu) {
    case AdminNavigation.WALLET:
      return (
        <div className="max-w-xl">
          <MintedItemAdd />
        </div>
      );
    case AdminNavigation.NFT:
      return (
        <div className="p-4">
          <h2 className="mb-5 text-lg font-bold">Add Admin NFTs</h2>
          <p>This nfts will be created with platform mother acount</p>
          <NftCreate admin />
        </div>
      );
    case AdminNavigation.ALBUM:
      return (
        <div className="p-4">
          <h2 className="mb-5 text-lg font-bold">Add Music Album</h2>
          <AlbumCreate mode={ModalMode.ADD} />
        </div>
      );

    case AdminNavigation.ADMIN:
      return <AddAdmin />;
  }
}

function IsAdmin() {
  const admin = api.wallate.admin.checkAdmin.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  if (admin.isLoading) return <div>Checking..</div>;
  if (admin.data) {
    return <AdminPageTemplate />;
  } else {
    return (
      <div>
        <CreateAdmin />
        <AdminsList />
      </div>
    );
    // return <p>You are not admin</p>;
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
