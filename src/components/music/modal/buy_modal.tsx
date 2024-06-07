import { useRef, useState } from "react";
import { api } from "~/utils/api";

import { useSession } from "next-auth/react";
import { WalletType, clientsign } from "package/connect_wallet";
import toast from "react-hot-toast";
import {
  AssetType,
  SongTokenCopies,
  TokenCopies,
} from "~/components/marketplace/market_right";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";
import BuyWithSquire from "~/components/marketplace/pay/buy_with_squire";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { get } from "lodash";
import { getPlaiceholder } from "plaiceholder";
import { getPlatfromAssetPrice } from "~/lib/stellar/fan/get_token_price";
import clsx from "clsx";
import { PLATFROM_ASSET } from "~/lib/stellar/fan/constant";

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
  const { platformAssetBalance } = useUserStellarAcc();

  const modal = useRef<HTMLDialogElement>(null);
  const [xdr, setXdr] = useState<string>();
  const [isWallet, setIsWallet] = useState(true);

  // const { asset } = item;
  const { code, issuer } = item;

  // feth the copies from the storage acc.

  const xdrMutaion =
    api.marketplace.steller.buyFromMarketPaymentXDR.useMutation({
      onSuccess: (data, Variable) => {
        setXdr(data);
      },
      onError: (e) => toast.error(e.message.toString()),
    });

  const handleModal = () => {
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
                Price: {price} {PLATFROM_ASSET.code}
              </p>
              <p className="font-bold">Price in USD: {priceUSD}$</p>
              <p className="text-sm">
                Copies available:{" "}
                {marketItemId ? (
                  <TokenCopies id={marketItemId} />
                ) : (
                  <SongTokenCopies issuer={issuer} code={code} />
                )}
              </p>
              <p className="text-sm">Issuer: {addrShort(issuer, 15)}</p>
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
                          className="btn btn-primary"
                          onClick={() => {
                            clientsign({
                              presignedxdr: xdr,
                              pubkey: session.data?.user.id,
                              walletType: session.data?.user.walletType,
                              test: clientSelect(),
                            })
                              .then((res) => {
                                if (res) toast.success("Payment Success");
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
                  disabled={xdrMutaion.isSuccess}
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
        onClick={handleModal}
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
