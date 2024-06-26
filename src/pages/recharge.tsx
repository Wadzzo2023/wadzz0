import { useSession } from "next-auth/react";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { useState } from "react";
import toast from "react-hot-toast";
import ConvertCard from "~/components/marketplace/recharge/convert_card";
import OfferCard from "~/components/marketplace/recharge/offer_card";
import PaymentCard from "~/components/marketplace/recharge/pay_card";
import { Offer } from "~/components/marketplace/recharge/types";
import { useRecharge } from "~/lib/state/recharge";
import { api } from "~/utils/api";

const offers: Offer[] = [
  { num: 10, price: 0.99, xlm: 5 },
  { num: 500, price: 4.99, xlm: 6 },
  { num: 500, price: 4.99 },
  { num: 1150, price: 9.99 },
  { num: 2300, price: 19.99 },
  { num: 3000, price: 24.99 },
  { num: 6000, price: 49.99 },
  { num: 15000, price: 99.99 },
];

function PayPage() {
  const { convertOpen, setOpen } = useRecharge();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <h2 className="text-3xl">Recharge Token</h2>
        {convertOpen ? <CovertSiteAsset /> : <SiteAssetBuy />}
      </div>
    </div>
  );
}

function CovertSiteAsset() {
  const [selected, setSelected] = useState(false);
  const xdrMuation = api.marketplace.steller.convertSiteAsset.useMutation({
    async onSuccess(data, variables, context) {
      if (data) {
        const presignedxdr = data;
        const res = await submitSignedXDRToServer4User(presignedxdr);
        if (res) {
          toast.success("Transaction successful.");
        } else {
          toast.error(
            "Transaction error, Code: Stellar. Please let any admin know.",
          );
        }
        setSelected(false);
      }
    },
  });

  function handleCovert() {
    xdrMuation.mutate({ siteAssetAmount: 20, xlm: "1" });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <ConvertCard
        handleClick={() => setSelected(!selected)}
        selected={selected}
      />
      {selected && (
        <button
          className="btn btn-primary w-full"
          onClick={() => handleCovert()}
        >
          {xdrMuation.isLoading && <span className="loading loading-spinner" />}
          Convert
        </button>
      )}
    </div>
  );
}

function SiteAssetBuy() {
  const session = useSession();
  const [xdr, setXDR] = useState<string>();

  const [selectedIdx, setSelection] = useState<number>(() => 0);
  const offersQ = api.marketplace.pay.getOffers.useQuery();
  const xdrMutation = api.marketplace.pay.getRechargeXDR.useMutation({
    onSuccess: (data) => {
      setXDR(data);
      toast.success("XDR fetched");
    },
    onError: (e) => toast.error(`${e.message}`),
  });

  function handleOfferChange(i: number) {
    if (i == selectedIdx) return;
    setXDR(undefined);
    setSelection(i);
  }

  const offers = offersQ.data;
  if (offers) {
    const selectedOffer = offers[selectedIdx];
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="my-5 flex flex-wrap justify-center gap-2">
          {offers.map((offer, i) => {
            return (
              <OfferCard
                handleClick={() => handleOfferChange(i)}
                key={i}
                selected={i == selectedIdx}
                num={offer.num}
                price={offer.price}
              />
            );
          })}
        </div>

        {selectedOffer && <SelectedOfferSummary offer={selectedOffer} />}

        {session.status == "authenticated" && selectedOffer && (
          <>
            {xdr ? (
              <PaymentCard
                xdr={xdr}
                {...{ pubkey: session.data.user.id }}
                offer={selectedOffer}
              />
            ) : (
              <button
                className="btn btn-primary"
                onClick={() =>
                  xdrMutation.mutate({
                    tokenNum: selectedOffer.num,
                    xlm: selectedOffer.price,
                  })
                }
              >
                Procced
              </button>
            )}
          </>
        )}
      </div>
    );
  }
}

interface ISelectedOfferSummary {
  offer?: Offer;
}
function SelectedOfferSummary({ offer }: ISelectedOfferSummary) {
  if (offer)
    return (
      <div>
        <p>
          Buy {offer.num} Wadzzo for $ {offer.price}
        </p>
      </div>
    );
  else <p>No offer selected</p>;
}

export default PayPage;
