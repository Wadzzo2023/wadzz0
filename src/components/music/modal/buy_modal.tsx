import { useRef } from "react";
import { api } from "~/utils/api";

import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import { AssetType } from "../album/table";
import { addrShort } from "~/lib/utils";
import toast from "react-hot-toast";
import { clientSelect } from "~/lib/stellar/fan/utils";
import {
  SongTokenCopies,
  TokenCopies,
} from "~/components/marketplace/market_right";

type BuyModalProps = {
  item: AssetType;
  placerId?: string | null;
  price: number;
  marketItemId?: number; // undefined will mean it is song
};
export default function BuyModal({
  item,
  placerId,
  price,
  marketItemId,
}: BuyModalProps) {
  const { needSign, pubkey, walletType } = useConnectWalletStateStore();

  const createAlbumModal = useRef<HTMLDialogElement>(null);

  const { asset } = item;
  const { code, issuer } = asset;

  // feth the copies from the storage acc.

  const xdrMutaion =
    api.marketplace.steller.buyFromMarketPaymentXDR.useMutation({
      onSuccess: (data, Variable) => {
        const presignedxdr = data;
        clientsign({
          presignedxdr,
          pubkey,
          walletType,
          test: clientSelect(),
        })
          .then((res) => {
            if (res) toast.success("Payment Success");
          })
          .catch((e) => console.log(e));
      },
      onError: () => toast.error("Payment Failed"),
    });

  const handleModal = () => {
    createAlbumModal.current?.showModal();
  };

  async function handleXDR() {
    // const balance = await checkAssetBalance({
    //   storagePub: STORAGE_PUB,
    //   assset: { code, issuer },
    // });
    // if (balance) {
    //   if (Number(balance) >= Number(DEFAULT_ASSET_LIMIT)) {
    //     {
    xdrMutaion.mutate({
      placerId,
      assetCode: code,
      issuerPub: issuer,
      limit: 1,
      signWith: needSign(),
    });
    //     }
    //   }
    // }
  }

  return (
    <>
      <dialog className="modal" ref={createAlbumModal}>
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              // onClick={handleCloseClick}
            >
              ✕
            </button>
          </form>
          <h3 className="mb-2 text-lg font-bold">BUY</h3>

          <div className="flex flex-col items-center gap-y-2">
            <div className="flex flex-col  bg-base-300 p-10">
              <p>
                Asset Name: <span className="badge badge-primary">{code}</span>
              </p>
              <p className="text-warning">Price: {price} XLM</p>
              <p className="text-sm text-accent">
                Copies available:{" "}
                {marketItemId ? (
                  <TokenCopies id={marketItemId} />
                ) : (
                  <SongTokenCopies issuer={issuer} code={code} />
                )}
              </p>
              <p className="text-sm">Issuer: {addrShort(issuer, 15)}</p>
            </div>

            <div className="flex flex-col items-center">
              {xdrMutaion.isLoading ? (
                <div>
                  <span className="loading loading-infinity loading-lg text-success"></span>
                </div>
              ) : (
                <button
                  disabled={xdrMutaion.isSuccess}
                  className="btn btn-success"
                  onClick={() => handleXDR()}
                >
                  Checkout for {code}
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
