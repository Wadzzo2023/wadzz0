import { useState } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { clientsign, WalletType } from "package/connect_wallet";
import toast from "react-hot-toast";
import BuyWithSquire from "~/components/marketplace/pay/buy_with_squire";
import RechargeLink from "~/components/marketplace/recharge/link";
import { Button } from "~/components/shadcn/ui/button";
import { Loader } from "lucide-react";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";
import { z } from "zod";
import { AssetType } from "~/lib/state/play/use-modal-store";
import { Card, CardContent } from "~/components/shadcn/ui/card";

type BuyModalProps = {
  item: AssetType;
  placerId?: string | null;
  price: number;
  priceUSD: number;
  marketItemId?: number;
  setClose: () => void;
};
export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export default function BuyItem({
  item,
  placerId,
  price,
  priceUSD,
  marketItemId,
  setClose,
}: BuyModalProps) {
  const session = useSession();
  const { needSign } = useNeedSign();
  const { code, issuer } = item;
  const { platformAssetBalance, active, getXLMBalance, balances, hasTrust } =
    useUserStellarAcc();
  const walletType = session.data?.user.walletType;

  const requiredFee = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: hasTrust(code, issuer) ? 0 : 0.5,
  });

  const [xdr, setXdr] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const showUSDPrice =
    walletType == WalletType.emailPass ||
    walletType == WalletType.google ||
    walletType == WalletType.facebook;
  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery({
    id: marketItemId,
  }, {
    enabled: !!marketItemId,
  });

  const xdrMutation =
    api.marketplace.steller.buyFromMarketPaymentXDR.useMutation({
      onSuccess: (data) => {
        setXdr(data);
      },
      onError: (e) => toast.error(e.message.toString()),
    });

  async function handleXDR(method: PaymentMethod) {
    xdrMutation.mutate({
      placerId,
      assetCode: code,
      issuerPub: issuer,
      limit: 1,
      signWith: needSign(),
      method,
    });
  }

  const changePaymentMethod = async (method: PaymentMethod) => {
    setPaymentMethod(method);
    await handleXDR(method);
  };

  const handlePaymentConfirmation = () => {
    setSubmitLoading(true);
    if (!xdrMutation.data) {
      toast.error("XDR data is missing.");
      return;
    }
    clientsign({
      presignedxdr: xdrMutation.data,
      pubkey: session.data?.user.id,
      walletType: session.data?.user.walletType,
      test: clientSelect(),
    })
      .then((res) => {
        if (res) {
          toast.success("Payment Successful");
          setClose();
          setPaymentSuccess(true);
          setIsBuyDialogOpen(false);
        }
      })
      .catch((e) => console.log(e))
      .finally(() => {
        setSubmitLoading(false);
        setIsBuyDialogOpen(false);
      });
  };

  if (!active) return null;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2 border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground">Checkout</h2>
            <p className="text-sm text-muted-foreground">
              Complete your purchase for <span className="font-semibold text-foreground">{item.name}</span>
            </p>
          </div>

          {/* Item Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="font-semibold text-foreground">
                {price} {PLATFORM_ASSET.code}
              </span>
            </div>
            {showUSDPrice && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">USD Price:</span>
                <span className="font-semibold text-foreground">${priceUSD}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Copies:</span>
              <span className="font-semibold text-foreground">{copy.data ?? "loading..."}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Issuer:</span>
              <span className="font-mono text-sm text-foreground">{addrShort(issuer, 7)}</span>
            </div>
          </div>

          {/* Availability Alert */}
          {copy.data !== undefined && (
            copy.data < 1 ? (
              <Alert type="warning" content="No copies available!" />
            ) : copy.data === 0 ? (
              <Alert type="error" content="No copies available!" />
            ) : null
          )}

          {/* Payment Section */}
          {copy.data && copy.data > 0 && (
            <div className="space-y-4">
              <PaymentOptions
                method={paymentMethod}
                setIsWallet={changePaymentMethod}
              />
              <MethodDetails
                paymentMethod={paymentMethod}
                xdrMutation={xdrMutation}
                requiredFee={requiredFee.data}
                price={price}
                priceUSD={priceUSD}
                platformAssetBalance={platformAssetBalance}
                getXLMBalance={getXLMBalance}
                hasTrust={hasTrust}
                code={code}
                issuer={issuer}
                item={item}
                onConfirmPayment={handlePaymentConfirmation}
                submitLoading={submitLoading}
                paymentSuccess={paymentSuccess}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function PaymentOptions({
  method,
  setIsWallet,
}: {
  method?: PaymentMethod;
  setIsWallet: (method: PaymentMethod) => void;
}) {
  const session = useSession();

  if (session.status !== "authenticated") return null;

  const walletType = session.data.user.walletType;
  const showCardOption =
    walletType === WalletType.emailPass ||
    walletType === WalletType.google ||
    walletType === WalletType.facebook;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Payment Method</h3>
      <div className="flex gap-2">
        <PaymentOption
          text={PLATFORM_ASSET.code}
          onClick={() => setIsWallet("asset")}
          selected={method === "asset"}
        />
        <PaymentOption
          text="XLM"
          onClick={() => setIsWallet("xlm")}
          selected={method === "xlm"}
        />
        {showCardOption && (
          <PaymentOption
            text="Credit Card"
            onClick={() => setIsWallet("card")}
            selected={method === "card"}
          />
        )}
      </div>
    </div>
  );
}

function PaymentOption({
  text,
  onClick,
  selected,
}: {
  text: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      variant={selected ? "default" : "outline"}
      className="flex-1"
    >
      {text}
    </Button>
  );
}
type MethodDetailsProps = {
  paymentMethod?: PaymentMethod;
  xdrMutation: ReturnType<
    typeof api.marketplace.steller.buyFromMarketPaymentXDR.useMutation
  >;
  requiredFee?: number;
  price: number;
  priceUSD: number;
  platformAssetBalance: number;
  getXLMBalance: () => string | undefined;
  hasTrust: (code: string, issuer: string) => boolean | undefined;
  code: string;
  issuer: string;
  item: AssetType;
  onConfirmPayment: () => void;
  submitLoading: boolean;
  paymentSuccess: boolean;
};

export function MethodDetails({
  paymentMethod,
  xdrMutation,
  requiredFee,
  price,
  priceUSD,
  platformAssetBalance,
  getXLMBalance,
  hasTrust,
  code,
  issuer,
  item,
  onConfirmPayment,
  submitLoading,
  paymentSuccess,
}: MethodDetailsProps) {
  if (xdrMutation.isLoading) return <Loader className="animate-spin" />;
  const { data: PriceInXLM } = api.marketplace.steller.getPlatformAssetToXLM.useQuery({
    price: price,
  },
    {
      enabled: paymentMethod === "xlm",
    }
  )
  if (xdrMutation.isError) {
    return (
      <Alert
        type="error"
        content={
          xdrMutation.error instanceof Error
            ? xdrMutation.error.message
            : "Error"
        }
      />
    );
  }

  if (xdrMutation.isSuccess && requiredFee) {
    if (paymentMethod === "asset") {
      const requiredAssetBalance = price + requiredFee;
      const isSufficientAssetBalance =
        platformAssetBalance >= requiredAssetBalance;

      return (
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="mb-4 font-semibold text-foreground">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Item Price:</span>
                <span className="font-medium text-foreground">
                  {price} {PLATFORM_ASSET.code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction Fee:</span>
                <span className="font-medium text-foreground">
                  {requiredFee} {PLATFORM_ASSET.code}
                </span>
              </div>
              <div className="border-t border-border pt-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total:</span>
                <span className="text-lg font-bold text-foreground">
                  {requiredAssetBalance} {PLATFORM_ASSET.code}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Action */}
          {isSufficientAssetBalance ? (
            <Button
              disabled={paymentSuccess}
              className="w-full"
              onClick={onConfirmPayment}
              size="lg"
            >
              {submitLoading && (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Payment
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-foreground">
                Your balance: <span className="font-semibold">{platformAssetBalance} {PLATFORM_ASSET.code}</span>
              </p>
              <p className="text-sm font-semibold text-destructive">Insufficient Balance</p>
              <RechargeLink />
            </div>
          )}
        </div>
      );
    }

    if (paymentMethod === "xlm") {
      const requiredXlmBalance =
        PriceInXLM?.priceInXLM ?? Infinity + 2 + (hasTrust(code, issuer) ? 0 : 0.5);
      const isSufficientAssetBalance =
        getXLMBalance() ?? 0 >= requiredXlmBalance;

      return (
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="mb-4 font-semibold text-foreground">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total in XLM:</span>
                <span className="text-lg font-bold text-foreground">{requiredXlmBalance} XLM</span>
              </div>
            </div>
          </div>

          {/* Payment Action */}
          {isSufficientAssetBalance ? (
            <Button
              disabled={paymentSuccess}
              className="w-full"
              onClick={onConfirmPayment}
              size="lg"
            >
              {submitLoading && (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Payment
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-foreground">
                Your balance: <span className="font-semibold">{getXLMBalance()} XLM</span>
              </p>
              <p className="text-sm font-semibold text-destructive">Insufficient Balance</p>
              <RechargeLink />
            </div>
          )}
        </div>
      );
    }

    if (paymentMethod === "card") {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="mb-2 font-semibold text-foreground">Credit Card Payment</h3>
            <p className="text-sm text-muted-foreground">Proceed to pay with your credit card.</p>
          </div>
          <BuyWithSquire marketId={item.id} xdr={xdrMutation.data} />
        </div>
      );
    }
  }

  return null;
}
