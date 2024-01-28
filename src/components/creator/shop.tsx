import { Creator } from "@prisma/client";
import React from "react";
import AddItem2Shop from "./add-shop-item";
import { api } from "~/utils/api";

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
      <ul>{items?.map((item) => <li key={item.id}>{item.code}</li>)}</ul>
    </div>
  );
}
