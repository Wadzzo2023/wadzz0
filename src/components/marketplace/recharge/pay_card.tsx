import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";
import { api } from "~/utils/api";
import type { Offer } from "./types";

import { useState } from "react";
import { env } from "~/env";
import toast from "react-hot-toast";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";

type PaymentCardType = {
  offer: Offer;
  pubkey: string;
  xdr: string;
  onSuccess?: () => void;
};

export default function PaymentCard({ offer, xdr, onSuccess }: PaymentCardType) {
  const [loading, setLoading] = useState(false);

  const paymentMutation = api.marketplace.pay.payment.useMutation({
    async onSuccess(data) {
      if (
        data &&
        typeof data === "object" &&
        "alreadySubmitted" in data &&
        data.alreadySubmitted
      ) {
        toast.success("Payment Successful! Tokens have been added to your account.");
        setLoading(false);
        onSuccess?.();
        return;
      }

      if (data) {
        const toastId = toast.loading("Submitting transaction");
        try {
          const res = await submitSignedXDRToServer4User(xdr);
          if (res) {
            toast.success("Payment Successful");
            onSuccess?.();
          } else {
            toast.error("Payment failed, Contact to admin");
          }
        } catch (e: unknown) {
          console.error(e);
          const msg = e instanceof Error ? e.message : "Token transfer failed";
          toast.error(msg);
        } finally {
          toast.dismiss(toastId);
          setLoading(false);
        }
      } else {
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      }
    },
    onError(err) {
      toast.error(err.message ?? "Payment failed. Please try again.");
      setLoading(false);
    },
  });

  return (
    <div className="max-w-sm">
      <PaymentForm
        applicationId={env.NEXT_PUBLIC_SQUARE_APP_ID}
        cardTokenizeResponseReceived={(token, verifiedBuyer) => {
          if (loading || paymentMutation.isLoading) return;
          setLoading(true);

          paymentMutation.mutate({
            sourceId: token.token,
            verificationToken: verifiedBuyer?.token,
            amount: Math.round(offer.price * 100), // cents
            tokenNum: offer.num,
          });
        }}
        createPaymentRequest={() => ({
          countryCode: "US",
          currencyCode: "USD",
          total: {
            amount: `${offer.price}`,
            label: `${offer.num} Tokens`,
          },
        })}
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
      {loading && <p className="mt-2 text-sm text-center text-muted-foreground">Processing payment...</p>}
    </div>
  );
}
