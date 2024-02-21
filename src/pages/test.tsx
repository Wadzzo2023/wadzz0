import React from "react";
import toast from "react-hot-toast";
import Slider from "~/components/ui/carosel";
import Carousel from "~/components/ui/carosel";
import { api } from "~/utils/api";

export default function TestPage() {
  const price = api.trx.getAssetPrice.useQuery();
  function handleClick(): void {
    // NextLogin("test3", "test").catch(() => console.log("err"));
  }

  if (price.isLoading) return <div>Loading...</div>;
  if (price.error) return <div>Error: {price.error.message}</div>;
  if (price.data) return <div>Price: {price.data}</div>;

  return (
    <div>
      TestPage
      <button onClick={() => handleClick()}>Login</button>
    </div>
  );
}
