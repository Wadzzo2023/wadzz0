import toast from "react-hot-toast";
import { PaymentForm, CreditCard } from "react-square-web-payments-sdk";
import { Offer } from "./types";
import { api } from "~/utils/api";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";

import log from "~/lib/logger/logger";
import { env } from "~/env";
import { getUserSecret } from "./utils";
import { useState } from "react";
import { useConnectWalletStateStore } from "package/connect_wallet";

type FIRST = { xlm: number; secret: string } | undefined;

type PaymentCardType = {
  offer: Offer;
  pubkey: string;
};
export default function PaymentCard({ pubkey, offer }: PaymentCardType) {
  const [loading, setLoading] = useState(false);

  const { email, uid } = useConnectWalletStateStore();
  const paymentMutation = api.marketplace.pay.payment.useMutation({
    async onSuccess(data, variables, context) {
      if (data) {
        const presignedxdr = data;
        toast.success("payment success");
        const res = await submitSignedXDRToServer4User(presignedxdr);
        if (res) {
          toast.success("transection sucessfull");
        } else {
          toast.error("error in steller");
        }
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

            if (uid && email) {
              const secret = await getUserSecret({ uid, email });
              paymentMutation.mutate({
                sourceId: token.token,
                amount: offer.price * 100, // payment gatway take cent input
                siteAssetAmount: offer.num,
                pubkey,
                secret,
                xlm: offer.xlm,
              });
            } else {
              toast.error("Wallet should be google or facebook");
              log.error("wallet should be google or facebook");
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
