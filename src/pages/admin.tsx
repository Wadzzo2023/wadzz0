import React from "react";
import AddAdmin from "~/components/admin/add_admin";
import AdminsList from "~/components/admin/admins";
import Bounty from "~/components/admin/bounty/Bounty";
import CreatorPage from "~/components/admin/creator/page";
import Pins from "~/components/admin/pins";
import UserList from "~/components/admin/users";
import NftCreate from "~/components/marketplace/nft_create";
import AlbumCreate from "~/components/music/modal/album_create";
import { ModalMode } from "~/components/music/modal/modal_template";
import MintedItemAdd from "~/components/wallete/add_asset_form";
import { AdminNavigation, useAdminMenu } from "~/lib/state/admin-tab-menu";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import AdminPinConsumptionReport from "./maps/pins/admin";

export default function AdminPage() {
  return <IsAdmin />;
}

function AdminPageTemplate() {
  return (
    <div className=" flex justify-center">
      <RenderTabs />
    </div>
  );
}

function RenderTabs() {
  const { selectedMenu } = useAdminMenu();

  switch (selectedMenu) {
    case AdminNavigation.WALLET:
      return (
        <div className=" w-full max-w-xl">
          <MintedItemAdd />
        </div>
      );
    case AdminNavigation.NFT:
      return (
        <div className="min-w-xl p-4">
          <h2 className="mb-5 text-lg font-bold">Add Admin NFTs</h2>
          <p className="text-center">
            These NFTs will be created with the {PLATFORM_ASSET.code} Admin
            account
          </p>
          <NftCreate admin />
        </div>
      );
    // case AdminNavigation.ALBUM:
    //   return (
    //     <div className="min-w-xl p-4">
    //       <h2 className="mb-5 text-lg font-bold">Add Music Album</h2>
    //       <AlbumCreate mode={ModalMode.ADD} />
    //     </div>
    //   );

    case AdminNavigation.ADMIN:
      return (
        <div>
          <AddAdmin />
          <AdminsList />
        </div>
      );
    case AdminNavigation.PINS:
      return <Pins />;
    case AdminNavigation.CREATORS:
      return <CreatorPage />;

    case AdminNavigation.USERS:
      return <UserList />;
    case AdminNavigation.COLLECTION_REPORTS:
      return <AdminPinConsumptionReport />;

    case AdminNavigation.BOUNTY:
      return <Bounty />;
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
      <div className="flex h-full items-center justify-center text-lg">
        You are not admin
      </div>
    );
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
