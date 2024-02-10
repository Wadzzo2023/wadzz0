import { Creator, ShopAsset } from "@prisma/client";
import React from "react";
import AddItem2Shop from "./add-shop-item";
import { api } from "~/utils/api";
import BuyItemModal from "../shop/buy-item-modal";
import { useSession } from "next-auth/react";

export default function Shop({ creator }: { creator?: Creator }) {
  return (
    <div>
      <div className="fixed bottom-0 right-0 p-4">
        <AddItem2Shop />
      </div>
      <AllShopItems />
    </div>
  );
}

function AllShopItems() {
  const { data: items, isLoading } = api.shop.getAllShopAsset.useQuery();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="flex flex-col items-center">
      <p className="my-5 text-center text-3xl font-bold">Shop items</p>
      <div className="flex flex-col gap-2">
        {items?.map((item) => <ShopItem item={item} />)}
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
      <div className="card w-96 bg-neutral shadow-xl">
        {/* "https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg" */}
        {/* {item.mediaUrl && (
        <figure className="relative h-40  w-full">
          <Image
            src={item.mediaUrl}
            layout="fill"
            objectFit="cover"
            alt="Asset"
          />
        </figure>
      )} */}
        <div className="card-body">
          <h2 className="card-title">{item.name}</h2>
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
