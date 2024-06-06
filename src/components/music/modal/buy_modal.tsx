import { useRef, useState } from "react";
import { api } from "~/utils/api";

import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
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

  const modal = useRef<HTMLDialogElement>(null);
  const [xdr, setXdr] = useState<string>();

  // const { asset } = item;
  const { code, issuer } = item;

  // feth the copies from the storage acc.

  const xdrMutaion =
    api.marketplace.steller.buyFromMarketPaymentXDR.useMutation({
      onSuccess: (data, Variable) => {
        setXdr(data);
        return;
        const presignedxdr = data;
        clientsign({
          presignedxdr,
          pubkey: session.data?.user.id,
          walletType: session.data?.user.walletType,
          test: clientSelect(),
        })
          .then((res) => {
            if (res) toast.success("Payment Success");
          })
          .catch((e) => console.log(e));
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
            <div className="flex flex-col  bg-base-300 p-10">
              <p>
                Asset Name: <span className="badge badge-primary">{code}</span>
              </p>
              <p className="text-warning">Price: {price} ACTION</p>
              <p className="text-warning">Price in USD: {priceUSD} ACTION</p>
              <p className="text-sm text-accent">
                Balance available:{" "}
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
                  <button
                    className="btn btn-secondary"
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
                  <button>
                    <BuyWithSquire marketId={item.id} xdr={xdr} />
                  </button>
                </>
              ) : (
                <button
                  disabled={xdrMutaion.isSuccess}
                  className="btn btn-secondary"
                  onClick={() => handleXDR()}
                >
                  {xdrMutaion.isLoading && (
                    <div>
                      <span className="loading"></span>
                    </div>
                  )}
                  Fetch XDR of {code}
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
        className="btn btn-secondary btn-sm my-2 w-full transition duration-500 ease-in-out"
        onClick={handleModal}
      >
        BUY
      </button>
    </>
  );
}
