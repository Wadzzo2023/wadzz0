import { useRef, useState } from "react";
import { api } from "~/utils/api";

import clsx from "clsx";
import { useSession } from "next-auth/react";
import { WalletType, clientsign } from "package/connect_wallet";
import toast from "react-hot-toast";
import { AssetType } from "~/components/marketplace/market_right";
import BuyWithSquire from "~/components/marketplace/pay/buy_with_squire";
import RechargeLink from "~/components/marketplace/recharge/link";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "~/components/shadcn/ui/dialog";

import { Loader } from "lucide-react";
import { z } from "zod";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";

type BuyModalProps = {
  item: AssetType;
  placerId?: string | null;
  price: number;
  priceUSD: number;
  marketItemId?: number; // undefined will mean it is song
};

export const PaymentMethodEnum = z.enum(["asset", "xlm", "card"]);

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export default function BuyModal({
  item,
  placerId,
  price,
  priceUSD,
  marketItemId,
}: BuyModalProps) {
  const session = useSession();
  const { needSign } = useNeedSign();
  const { platformAssetBalance, active, getXLMBalance } = useUserStellarAcc();

  const modal = useRef<HTMLDialogElement>(null);
  const [xdr, setXdr] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  // const { asset } = item;
  const { code, issuer } = item;

  const [submitLoading, setSubmitLoading] = useState(false);

  // fetCh the copies from the storage acc.

  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery({
    id: marketItemId,
  });

  const xdrMutation =
    api.marketplace.steller.buyFromMarketPaymentXDR.useMutation({
      onSuccess: (data, Variable) => {
        setXdr(data);
      },
      onError: (e) => toast.error(e.message.toString()),
    });

  const handleModal = (close?: true) => {
    if (close) {
      return modal.current?.close();
    }
    modal.current?.showModal();
  };

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

  const changePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    handleXDR(method);
  };

  if (!active) return null;
  return (
    <>
      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent className="modal-box">
          <div className="flex flex-col items-center gap-y-2">
            <div className="flex flex-col gap-2  bg-base-200 p-10">
              <p>
                Asset Name: <span className="badge badge-primary">{code}</span>
              </p>
              <p className="font-bold">
                Price: {price} {PLATFORM_ASSET.code}
              </p>
              <p className="font-bold">Price in USD : ${priceUSD}</p>
              <p className="text-sm">
                Copies available: {copy.data ?? "loading..."}
              </p>
              <p className="text-sm">Issuer: {addrShort(issuer, 15)}</p>
              {copy.data && copy.data < 1 && (
                <Alert type="error" content={"You have to be minimum 1 copy"} />
              )}
            </div>
            {/* <BuyWithSquire marketId={item.id} xdr={xdr ?? "xdr"} /> */}

            <div className="flex flex-col items-center">
              <>
                <PaymentOptions
                  method={paymentMethod}
                  setIsWallet={changePaymentMethod}
                />
                <MethodDetails />
              </>
            </div>
          </div>
          <DialogFooter>
            <DialogClose>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <button
        disabled={copy.data === 0}
        className="btn btn-primary btn-sm my-2 w-full transition duration-500 ease-in-out"
        onClick={() => setIsBuyDialogOpen(true)}
      >
        BUY
      </button>
    </>
  );

  function MethodDetails() {
    if (xdrMutation.isLoading) return <Loader className="animate-spin" />;

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

    if (xdrMutation.isSuccess) {
      if (paymentMethod === "asset") {
        const requiredAssetBalance = price + 1 + 0.5;
        const isSufficientAssetBalance =
          platformAssetBalance >= requiredAssetBalance;
        return (
          <>
            {isSufficientAssetBalance ? (
              <>
                <p>
                  You need total {requiredAssetBalance} {PLATFORM_ASSET.code} to
                  buy this item!
                </p>
                <button
                  disabled={paymentSuccess}
                  className="btn btn-primary"
                  onClick={() => {
                    // toast("hi");
                    setSubmitLoading(true);
                    clientsign({
                      presignedxdr: xdrMutation.data,
                      pubkey: session.data?.user.id,
                      walletType: session.data?.user.walletType,
                      test: clientSelect(),
                    })
                      .then((res) => {
                        if (res) {
                          toast.success("Payment Success");
                          setPaymentSuccess(true);
                          handleModal(true);
                        }
                      })
                      .catch((e) => console.log(e))
                      .finally(() => setSubmitLoading(false));
                  }}
                >
                  {submitLoading && <Loader className="animate-spin" />}
                  Confirm Payment
                </button>
              </>
            ) : (
              <>
                <p className="mt-2">
                  You have {platformAssetBalance} {PLATFORM_ASSET.code}
                </p>
                <p className="mb-2 text-error">Insufficient Balance</p>
                <RechargeLink />
              </>
            )}
          </>
        );
      }
      if (paymentMethod === "xlm") {
        const requiredXlmBalance = price * 0.7 + 1 + 0.5;
        const isSufficientAssetBalance =
          getXLMBalance() ?? 0 >= requiredXlmBalance;
        return (
          <>
            {isSufficientAssetBalance ? (
              <>
                <p>You need total {requiredXlmBalance} XLM to buy this item!</p>
                <button
                  disabled={paymentSuccess}
                  className="btn btn-primary"
                  onClick={() => {
                    // toast("hi");
                    setSubmitLoading(true);
                    clientsign({
                      presignedxdr: xdrMutation.data,
                      pubkey: session.data?.user.id,
                      walletType: session.data?.user.walletType,
                      test: clientSelect(),
                    })
                      .then((res) => {
                        if (res) {
                          toast.success("Payment Success");
                          setPaymentSuccess(true);
                          handleModal(true);
                        }
                      })
                      .catch((e) => console.log(e))
                      .finally(() => setSubmitLoading(false));
                  }}
                >
                  {submitLoading && <Loader className="animate-spin" />}
                  Confirm Payment
                </button>
              </>
            ) : (
              <>
                <p className="mt-2">You have {getXLMBalance()} XLM</p>
                <p className="mb-2 text-error">Insufficient Balance</p>
                <RechargeLink />
              </>
            )}
          </>
        );
      }
      if (paymentMethod === "card") {
        return (
          <button>
            <BuyWithSquire marketId={item.id} xdr={xdrMutation.data} />
          </button>
        );
      }
    }
  }
}

function PaymentOptions({
  method,
  setIsWallet,
}: {
  method?: PaymentMethod;
  setIsWallet: (method: PaymentMethod) => void;
}) {
  const session = useSession();

  if (session.status == "authenticated") {
    const walletType = session.data.user.walletType;
    const showCardOption =
      walletType == WalletType.emailPass ||
      walletType == WalletType.google ||
      walletType == WalletType.facebook;
    return (
      <div>
        <h2 className="text-center font-semibold">Choose payment option</h2>
        <div className="my-2 flex gap-2">
          <Option
            text={PLATFORM_ASSET.code}
            onClick={() => setIsWallet("asset")}
            selected={method === "asset"}
          />
          <Option
            text="XLM"
            onClick={() => setIsWallet("xlm")}
            selected={method === "xlm"}
          />
          {showCardOption && (
            <Option
              text="Credit Card"
              onClick={() => setIsWallet("card")}
              selected={method === "card"}
            />
          )}
        </div>
      </div>
    );
  }
  function Option({
    text,
    onClick,
    selected,
  }: {
    text: string;
    onClick: () => void;
    selected?: boolean;
  }) {
    return (
      <div
        onClick={onClick}
        className={clsx(
          "flex h-10 items-center justify-center bg-base-300 p-4",
          selected && "border-2 border-primary",
        )}
      >
        {text}
      </div>
    );
  }
}
