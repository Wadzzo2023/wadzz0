import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";

import log from "~/lib/logger/logger";
import { DEFAULT_ASSET_LIMIT, STORAGE_PUB } from "~/lib/stellar/music/constant";
import { checkAssetBalance } from "~/lib/stellar/music/trx/create_song_token";

import { Song } from "@prisma/client";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import Alert from "~/components/ui/alert";
import { Balance4, useBalanceStore } from "~/lib/state/music/storageAcc";
import { addrShort } from "~/lib/wallate/utils";
import { SongWithAsset } from "../album/table";

type BuyModalProps = {
  item: SongWithAsset;
  // button: ReactNode;
};
export default function BuyModal({
  item,
  // copies,
}: BuyModalProps) {
  const { needSign, pubkey, walletType } = useConnectWalletStateStore();

  const [xdr, setXdr] = useState<string>();
  const createAlbumModal = useRef<HTMLDialogElement>(null);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [submitL, setsLoad] = useState(false);

  const { id: songId, asset } = item;
  const { code, issuer, price } = asset;

  // aviable copies are the balance of storage
  const copies = useBalanceStore((state) =>
    state.getAssetBalance({
      code,
      issuer,
      limit: true,
      for: Balance4.STORAGE,
    }),
  );

  const xdrMutaion = api.music.steller.getPaymentXDR.useMutation({
    onSuccess: (data, Variable) => {
      if (data) setXdr(data);
    },
    onError: () => {
      setsLoad(false);
    },
  });
  const songAddMutation = api.music.song.buySong.useMutation({});

  const handleModal = () => {
    createAlbumModal.current?.showModal();
  };
  async function handleConfirmClick() {
    if (xdr) {
      const res = await clientsign({ walletType, pubkey, presignedxdr: xdr });
      if (res) {
        songAddMutation.mutate({ songId });
      } else {
        toast.error("Payment is not successfull, Try again");
      }
      setsLoad(false);
    }
  }

  async function handleXDR() {
    try {
      setLoading(true);
      const balance = await checkAssetBalance({
        storagePub: STORAGE_PUB,
        assset: { code, issuer },
      });
      if (balance) {
        if (Number(balance) >= Number(DEFAULT_ASSET_LIMIT)) {
          {
            xdrMutaion.mutate({
              pubkey,
              assetCode: code,
              issuerPub: issuer,
              price,
              limit,
              signWith: needSign(),
            });
          }
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      setErr("There are some problem");
      log.info(error);
    }
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
              <p className="text-sm text-accent">Copies available: {copies}</p>
              <p className="text-sm">Issuer: {addrShort(issuer, 15)}</p>
            </div>

            <div>
              {songAddMutation.isSuccess && (
                <Alert
                  type="success"
                  content="You have succesfull bought this nft song, you will find this in your home page"
                />
              )}
              {err && <Alert type="error" content={err} />}
              {xdrMutaion.isError && (
                <Alert type="error" content={xdrMutaion.error.message} />
              )}
            </div>

            <div className="flex flex-col items-center">
              {xdrMutaion.isLoading || loading ? (
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

              {submitL || songAddMutation.isLoading ? (
                <div>
                  <span className="loading loading-infinity loading-lg text-success"></span>
                </div>
              ) : (
                <button
                  disabled={
                    !xdrMutaion.isSuccess ||
                    songAddMutation.isSuccess ||
                    xdr === undefined ||
                    err !== undefined
                  }
                  className="btn btn-success mt-3"
                  onClick={() => {
                    void (async () => {
                      await handleConfirmClick();
                    })();
                  }}
                >
                  Pay using Stellar
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

        {/* <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form> */}
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
