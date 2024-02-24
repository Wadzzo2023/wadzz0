import { Creator, ShopAsset } from "@prisma/client";
import React from "react";
import AddItem2Shop from "./add-shop-item";
import { api } from "~/utils/api";
import BuyItemModal from "../shop/buy-item-modal";
import { useSession } from "next-auth/react";
import ContextMenu from "../ui/context-menu";

export default function Shop({ creator }: { creator?: Creator }) {
  return (
    <div className="my-7">
      <div className="fixed bottom-0 right-0 z-50 p-4">
        <AddItem2Shop />
      </div>
      <AllShopItems />
    </div>
  );
}

function AllShopItems() {
  const {
    data: items,
    isLoading,
    isError,
  } = api.shop.getAllShopAsset.useQuery();
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error </div>;
  if (items?.length == 0) return <div>There is no item</div>;
  return (
    <div className="flex flex-col items-center">
      {/* <p className=" text-center text-lg font-bold">Shop items</p> */}
      <div className="flex flex-col gap-2">
        {items?.map((item) => <ShopItem key={item.id} item={item} />)}
      </div>
    </div>
  );
}

export interface ShopItemProps extends ShopAsset {
  asset: {
    code: string;
    issuer: string;
  };
}

export function ShopItem({ item }: { item: ShopItemProps }) {
  const { data } = useSession();
  if (data)
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between">
            <h2 className="card-title">{item.name}</h2>
            <ShopItemContextMenu creatorId={item.creatorId} itemId={item.id} />
          </div>
          <p>{item.description}</p>
          <div className="card-actions justify-end">
            <button className="btn btn-outline btn-primary self-start">
              {item.asset.code}
            </button>
            {item.creatorId != data.user.id && <BuyItemModal item={item} />}
          </div>
        </div>
      </div>
      // <div className="card w-96 rounded-full bg-base-300">
      //   <p>{item.name}</p>
      //   <p>{item.price}</p>
      // </div>
    );
}
function ShopItemContextMenu({
  creatorId,
  itemId,
}: {
  creatorId: string;
  itemId: number;
}) {
  const { data } = useSession();
  const deleteAsset = api.shop.deleteAsset.useMutation();

  const handleDelete = () => deleteAsset.mutate(itemId);

  if (data?.user && data.user.id === creatorId) {
    return (
      <ContextMenu
        handleDelete={handleDelete}
        isLoading={deleteAsset.isLoading}
      />
    );
  }
}
