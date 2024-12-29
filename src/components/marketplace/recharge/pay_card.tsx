import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";
import { api } from "~/utils/api";
import { Offer } from "./types";

import { useState } from "react";
import { env } from "~/env";
import toast from "react-hot-toast";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { rechargeTask } from "~/trigger/recharge";

type FIRST = { xlm: number; secret: string } | undefined;

type PaymentCardType = {
  offer: Offer;
  pubkey: string;
  xdr: string;
};
export default function PaymentCard({ pubkey, offer, xdr }: PaymentCardType) {
  const [loading, setLoading] = useState(false);

  const paymentMutation = api.marketplace.pay.payment.useMutation({
    async onSuccess(data, variables, context) {
      if (data) {
        const tostId = toast.loading("Submitting transaction");
        submitSignedXDRToServer4User(xdr)
          .then((data) => {
            if (data) {
              toast.success("Payment Successful");
            } else {
              toast.error("Payment failed, Contact to admin");
            }
          })
          .catch((e) => {
            console.log(e);
            toast.error("Payment failed");
          })
          .finally(() => {
            toast.dismiss(tostId);
          });
      } else {
        toast.error("Payment failed. Please try again.");
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
            // console.log("token:", token);
            // console.log("verifiedBuyer:", verifiedBuyer);

            paymentMutation.mutate({
              sourceId: token.token,
              amount: offer.price * 100, // payment gatway take cent input
            });

            // if (token.token) {
            //   rechargeTask.trigger({ sourceId: token.token, xdr: "xdr" });
            // }

            setLoading(false);
          })()
        }
        locationId={env.NEXT_PUBLIC_SQUARE_LOCATION}
      >
        <CreditCard
          style={{
            ".message-text": {
              color: "green",
            },
            ".message-icon": {
              color: "green",
            },
          }}
        />
      </PaymentForm>
      {loading && <p>Loading...</p>}
    </div>
  );
}
