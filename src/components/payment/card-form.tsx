"use client";

import { CreditCard as CardIcon } from "lucide-react";
import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";

import { env } from "~/env";

/**
 * Square card entry. Tokenizes the card in the browser; the server charges it
 * (after its own checks) — the amount is never taken from here.
 */
export function CardForm({ usd, disabled, onToken }: { usd: number; disabled?: boolean; onToken: (t: { sourceId: string; verificationToken?: string }) => void }) {
  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <PaymentForm
        applicationId={env.NEXT_PUBLIC_SQUARE_APP_ID}
        locationId={env.NEXT_PUBLIC_SQUARE_LOCATION}
        cardTokenizeResponseReceived={(token, buyer) => {
          if ("token" in token && token.token) onToken({ sourceId: token.token, verificationToken: buyer?.token });
        }}
        createVerificationDetails={() => ({
          amount: usd.toFixed(2),
          currencyCode: "USD",
          intent: "CHARGE",
          billingContact: {},
        })}
      >
        <CreditCard buttonProps={{ isLoading: disabled }}>
          <span className="inline-flex items-center gap-2">
            <CardIcon className="size-4" /> Pay ${usd.toFixed(2)}
          </span>
        </CreditCard>
      </PaymentForm>
    </div>
  );
}
