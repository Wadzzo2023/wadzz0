import React from "react";
import toast from "react-hot-toast";
import EnableInMarket from "~/components/marketplace/modal/place_market_modal";
import Slider from "~/components/ui/carosel";
import Carousel from "~/components/ui/carosel";
import { api } from "~/utils/api";

export default function TestPage() {
  return (
    <div>
      TestPage
      <EnableInMarket item={{ code: "code", issuer: "lkdjfkd lkajdfkdj" }} />
    </div>
  );
}
