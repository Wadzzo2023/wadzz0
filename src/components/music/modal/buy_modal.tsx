import { useRef, useState } from "react";
import { api } from "~/utils/api";

import clsx from "clsx";
import { useSession } from "next-auth/react";
import { WalletType, clientsign } from "package/connect_wallet";
import toast from "react-hot-toast";
import { AssetType } from "~/components/marketplace/market_right";
import BuyWithSquire from "~/components/marketplace/pay/buy_with_squire";
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
export default function BuyModal({
  item,
  placerId,
  price,
  priceUSD,
  marketItemId,
}: BuyModalProps) {
  const session = useSession();
  const { needSign } = useNeedSign();
  const { platformAssetBalance, active } = useUserStellarAcc();

  const modal = useRef<HTMLDialogElement>(null);
  const [xdr, setXdr] = useState<string>();
  const [isWallet, setIsWallet] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // const { asset } = item;
  const { code, issuer } = item;

  // feth the copies from the storage acc.

  const copy = api.marketplace.market.getMarketAssetAvailableCopy.useQuery({
    id: marketItemId,
  });

  const xdrMutaion =
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

  async function handleXDR() {
    xdrMutaion.mutate({
      placerId,
      assetCode: code,
      issuerPub: issuer,
      limit: 1,
      signWith: needSign(),
    });
  }

  if (!active) return null;
  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="mb-2 text-lg font-bold">BUY</h3>

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
              {xdr ? (
                <>
                  <PaymentOptoins
                    isWallete={isWallet}
                    setIsWallet={setIsWallet}
                  />
                  {isWallet ? (
                    <>
                      {platformAssetBalance >= price ? (
                        <button
                          disabled={paymentSuccess}
                          className="btn btn-primary"
                          onClick={() => {
                            clientsign({
                              presignedxdr: xdr,
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
                              .catch((e) => console.log(e));
                          }}
                        >
                          Confirm Payment
                        </button>
                      ) : (
                        <p className="text-error">Insufficient Balance</p>
                      )}
                    </>
                  ) : (
                    <button>
                      <BuyWithSquire marketId={item.id} xdr={xdr} />
                    </button>
                  )}
                </>
              ) : (
                <button
                  disabled={
                    xdrMutaion.isSuccess || !copy.isSuccess || copy.data < 1
                  }
                  className="btn btn-primary"
                  onClick={() => handleXDR()}
                >
                  {xdrMutaion.isLoading && (
                    <div>
                      <span className="loading"></span>
                    </div>
                  )}
                  Proceed to checkout
                </button>
              )}
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
      <button
        className="btn btn-primary btn-sm my-2 w-full transition duration-500 ease-in-out"
        onClick={() => handleModal()}
      >
        BUY
      </button>
    </>
  );
}

function PaymentOptoins({
  isWallete,
  setIsWallet,
}: {
  isWallete: boolean;
  setIsWallet: (isWallet: boolean) => void;
}) {
  const session = useSession();

  if (session.status == "authenticated") {
    const walletType = session.data.user.walletType;
    const showCardOption =
      walletType == WalletType.emailPass ||
      walletType == WalletType.google ||
      walletType == WalletType.facebook;
    return (
      <div className="my-2 flex gap-2">
        <Optoin
          text="Stellar"
          onClick={() => setIsWallet(true)}
          selected={isWallete}
        />
        {showCardOption && (
          <Optoin
            text="Credit Card"
            onClick={() => setIsWallet(false)}
            selected={!isWallete}
          />
        )}
      </div>
    );
  }
  function Optoin({
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
