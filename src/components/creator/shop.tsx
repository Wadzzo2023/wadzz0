import { Creator, ShopAsset } from "@prisma/client";
import React from "react";
import AddItem2Shop from "./add-shop-item";
import { api } from "~/utils/api";
import BuyItemModal from "../shop/buy-item-modal";

export default function Shop({ creator }: { creator: Creator }) {
  return (
    <div>
      <p>Shop {creator.bio}</p>
      <AddItem2Shop />
      <AllShopItems />
    </div>
  );
}

function AllShopItems() {
  const { data: items, isLoading } = api.shop.getAllShopAsset.useQuery();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <p>Shop items</p>
      <ul>
        {items?.map((item) => (
          <li key={item.id}>
            <ShopItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ShopItemProps extends ShopAsset {
  asset: {
    code: string;
    issuer: string;
  };
}

function ShopItem({ item }: { item: ShopItemProps }) {
  return (
    <div className="card">
      <p>{item.name}</p>
      <p>{item.description}</p>
      <p>{item.price}</p>
      <p>{item.creatorId}</p>
      <BuyItemModal item={item} />
    </div>
  );
}
