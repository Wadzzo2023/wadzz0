import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";
import { api } from "~/utils/api";
import { Offer } from "./types";

import { useState } from "react";
import { env } from "~/env";

type FIRST = { xlm: number; secret: string } | undefined;

type PaymentCardType = {
  offer: Offer;
  pubkey: string;
};
export default function PaymentCard({ pubkey, offer }: PaymentCardType) {
  const [loading, setLoading] = useState(false);

  const paymentMutation = api.marketplace.pay.payment.useMutation({
    async onSuccess(data, variables, context) {
      if (data) {
        const presignedxdr = data;
        // toast.success("payment success");
        // const res = await submitSignedXDRToServer4User(presignedxdr);
        // if (res) {
        // toast.success("transection sucessfull");
        // } else {
        // toast.error("error in steller");
        // }
      }
    },
  });

  return (
    <div className="max-w-sm">
      <PaymentForm
        applicationId={env.NEXT_PUBLIC_SQUARE_APP_ID}
        cardTokenizeResponseReceived={(token, verifiedBuyer) =>
          void (async () => {
            setLoading(true);
            console.log("token:", token);
            console.log("verifiedBuyer:", verifiedBuyer);

            paymentMutation.mutate({
              sourceId: token.token,
              amount: offer.price * 100, // payment gatway take cent input
              siteAssetAmount: offer.num,
              xlm: offer.xlm,
            });
            setLoading(false);
          })()
        }
        locationId={env.NEXT_PUBLIC_SQUARE_LOCATION}
      >
        <CreditCard />
      </PaymentForm>
      {loading && <p>Loading...</p>}
    </div>
  );
}
