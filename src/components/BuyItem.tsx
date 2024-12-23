import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { clientsign, WalletType } from "package/connect_wallet";
import toast from "react-hot-toast";
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
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import {
    PLATFORM_ASSET,
    PLATFORM_FEE,
    TrxBaseFeeInPlatformAsset,
} from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";
import { z } from "zod";
import clsx from "clsx";
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
        <>
            <Card>
                <CardContent className="">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Checkout</h2>
                            <p className="text-sm text-gray-500">
                                Complete your purchase for {item.name}
                            </p>
                        </div>
                        <div className="grid gap-2  ">
                            <div className="flex justify-between ">
                                <span>Price:</span>
                                <span className="font-semibold">
                                    {price} {PLATFORM_ASSET.code}
                                </span>
                            </div>
                            {
                                showUSDPrice && <div className="flex justify-between">
                                    <span>Price in USD:</span>
                                    <span className="font-semibold">${priceUSD}</span>
                                </div>
                            }

                            <div className="flex justify-between">
                                <span>Copies available:</span>
                                <span>{copy.data ?? "loading..."}</span>
                            </div>
                            <div className="flex justify-between ">
                                <span>Issuer:</span>
                                <span>{addrShort(issuer, 7)}</span>
                            </div>
                        </div>
                        {copy.data && copy.data < 1 ? (
                            <Alert type="warning" content={"No copies available!"} />
                        )
                            :
                            !copy.data ? (
                                <Alert type="error" content={"No copies available!"} />
                            ) : <></>
                        }
                        {
                            copy.data && copy.data > 0 ?
                                (
                                    <>
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
                                    </>

                                ) :
                                <></>
                        }
                    </div>

                </CardContent>
            </Card>

        </>
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
            <Button
                onClick={() => onClick()}
                variant={selected ? "destructive" : "default"}
                className={clsx(
                    "flex items-center justify-center w-full ",

                )}
            >
                {text}
            </Button>
        );
    }
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
                    <div className="rounded-lg bg-gray-100 p-4">
                        <h3 className="mb-2 font-semibold">Payment Summary</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span>Item Price:</span>
                                <span>
                                    {price} {PLATFORM_ASSET.code}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fee:</span>
                                <span>
                                    {requiredFee} {PLATFORM_ASSET.code}
                                </span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Total:</span>
                                <span>
                                    {requiredAssetBalance} {PLATFORM_ASSET.code}
                                </span>
                            </div>
                        </div>
                    </div>
                    {isSufficientAssetBalance ? (
                        <Button
                            disabled={paymentSuccess}
                            className="w-full"
                            onClick={onConfirmPayment}
                        >
                            {submitLoading && (
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirm Payment
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <p>
                                Your balance: {platformAssetBalance} {PLATFORM_ASSET.code}
                            </p>
                            <p className="text-sm text-red-500">Insufficient Balance</p>
                            <RechargeLink />
                        </div>
                    )}
                </div>
            );
        }

        if (paymentMethod === "xlm") {
            const requiredXlmBalance =
                priceUSD + 2 + (hasTrust(code, issuer) ? 0 : 0.5);
            const isSufficientAssetBalance =
                getXLMBalance() ?? 0 >= requiredXlmBalance;

            return (
                <div className="space-y-4">
                    <div className="rounded-lg bg-gray-100 p-4">
                        <h3 className="mb-2 font-semibold">Payment Summary</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span>Total in XLM:</span>
                                <span>{requiredXlmBalance} XLM</span>
                            </div>
                        </div>
                    </div>
                    {isSufficientAssetBalance ? (
                        <Button
                            disabled={paymentSuccess}
                            className="w-full"
                            onClick={onConfirmPayment}
                        >
                            {submitLoading && (
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirm Payment
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <p>Your balance: {getXLMBalance()} XLM</p>
                            <p className="text-sm text-red-500">Insufficient Balance</p>
                            <RechargeLink />
                        </div>
                    )}
                </div>
            );
        }

        if (paymentMethod === "card") {
            return (
                <div className="space-y-4">
                    <div className="rounded-lg bg-gray-100 p-4">
                        <h3 className="mb-2 font-semibold">Credit Card Payment</h3>
                        <p>Proceed to pay with your credit card.</p>
                    </div>
                    <BuyWithSquire marketId={item.id} xdr={xdrMutation.data} />
                </div>
            );
        }
    }

    return null;
}
