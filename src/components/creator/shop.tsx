import { Creator } from "@prisma/client";
import React from "react";
import AddItem2Shop from "./add-shop-item";

export default function Shop({ creator }: { creator: Creator }) {
  return (
    <div>
      <p>Shop {creator.bio}</p>
      <AddItem2Shop />
    </div>
  );
}
