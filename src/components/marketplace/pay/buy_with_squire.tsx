import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";
import { env } from "~/env";
import { api } from "~/utils/api";

interface BuyWithSquirePropsType {
  xdr: string;
  marketId: number;
}

export default function BuyWithSquire({
  xdr,
  marketId,
}: BuyWithSquirePropsType) {
  const [loading, setLoading] = useState(false);

  const paymentMutation = api.marketplace.pay.buyAsset.useMutation({
    onSuccess: async (data, variables, context) => {
      toast.success(`${data}`);
      if (data) {
        toast.success("xdr get");
        if (data) {
          const id = data;
          const tostId = toast.loading("Submitting transaction");
          submitSignedXDRToServer4User(xdr)
            .then((data) => {
              if (data) {
                toast.success("Payment Successful");
              }
            })
            .catch((e) => {

              toast.error("Payment failed");
            })
            .finally(() => {
              toast.dismiss(tostId);
            });
        }
      } else {
        toast.error("Payment failed. Please try again.");
      }
    },
    onError: (e) => {
      toast.error("Something went wrong. Please try again.");

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

            if (token.token) {
              paymentMutation.mutate({
                sourceId: token.token,
                assetId: marketId,
              });
            } else {
              toast.error("Error squire in token");
            }

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
