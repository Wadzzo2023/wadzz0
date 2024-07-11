import React from "react";
import CreateTrade from "./create-trade";
import { api } from "~/utils/api";
import { match } from "ts-pattern";
import { loading, empty, error, success } from "~/utils/trcp/patterns";
import BuyOfferDialog from "./buy-offer-dialog";

export default function TradeMarket() {
  return (
    <div className="flex h-full items-center justify-center"> Coming Soon</div>
  );
  const offers = api.marketplace.trade.getOffers.useQuery();
  const offerC = match(offers)
    .with(loading, () => <div>Loading...</div>)
    .with(error, () => <div>Error</div>)
    .with(empty, () => <div>No offers</div>)
    .with(success, (data) => {
      return (
        <ul>
          {data.data?.records.map((el) => (
            <li key={el.id}>
              {el.id} <BuyOfferDialog offerId={el.id} />
            </li>
          ))}
        </ul>
      );
    })
    .otherwise(() => null);
  return (
    <div>
      Offers
      {offerC}
      <CreateTrade />
    </div>
  );
}
