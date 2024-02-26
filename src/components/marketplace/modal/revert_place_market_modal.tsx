import albedo from "@albedo-link/intent";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { clientsign } from "package/connect_wallet/src/lib/stellar/utils";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { env } from "~/env";
import log from "~/lib/logger/logger";
import { DEFAULT_ASSET_LIMIT } from "~/lib/stellar/constant";
import { checkAssetBalance } from "~/lib/stellar/trx/create_song_token";
import { NFT } from "~/lib/types/dbTypes";
import { addrShort } from "~/lib/utils";
import { api } from "~/utils/api";
import { ErrorAlert } from "../alert/error";
import { SuccessAlert } from "../alert/success";

type PlaceMarketModalProps = {
  item: NFT;
};
export default function RevertPlaceMarketModal({
  item,
}: PlaceMarketModalProps) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const [xdr, setXdr] = useState<string>();
  const createAlbumModal = useRef<HTMLDialogElement>(null);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [submitL, setsLoad] = useState(false);

  const [quantity, setQuantity] = useState<number>(1);

  const xdrMutaion = api.steller.RevertBackMarketPlaceXDR.useMutation({
    onSuccess: (data, Variable) => {
      if (data) setXdr(data);
    },
    onError: () => {
      setsLoad(false);
    },
  });

  const utils = api.useContext();
  // const nftAddMutation = api.user.addNft.useMutation({
  //   async onSuccess(data, variables, context) {
  //     await utils.steller.getStorageBalances.invalidate();
  //   },
  // });

  const revertNftMutation = api.market.revertNft2Market.useMutation({
    async onSuccess() {
      await utils.market.getMarketNft.invalidate();
    },
  });

  function resetState() {
    setXdr(undefined);
    setErr(undefined);
    setLoading(false);
    setsLoad(false);
    xdrMutaion.reset();
    revertNftMutation.reset();
  }

  const handleModal = () => {
    createAlbumModal.current?.showModal();
  };

  async function handleConfirmClick() {
    if (xdr) {
      if (
        env.NEXT_PUBLIC_STELLAR_PUBNET ||
        walletType == WalletType.google ||
        walletType == WalletType.facebook
      ) {
        setsLoad(true);
        const res = await clientsign({ walletType, pubkey, presignedxdr: xdr });
        if (res) {
          // payment succesfull
          revertNftMutation.mutate({
            quantity,
            nftId: item.id,
            pubkey,
          });
        } else {
          toast("Payment is not successful, Try again");
        }
        setsLoad(false);
      } else {
        // for test net only albedo
        const res = albedo.tx({
          xdr,
          network: "testnet",
          pubkey,
          submit: true,
        });
        res
          .then((response) => {
            log.info("ihRes", response.result);
            toast.success("payment sucessfull");
            revertNftMutation.mutate({
              quantity,
              nftId: item.id,
              pubkey,
            });
          })
          .catch((e) => {
            log.info("ihErro", e, false);
          });
      }
    } else {
      toast("First get the xdr");
    }
  }

  function handleXDR() {
    try {
      setLoading(true);
      // for place to marketplace user should have this token.

      xdrMutaion.mutate({
        pubkey,
        assetCode: item.nftAsset.code,
        issuerPub: item.nftAsset.issuer.pub,
        copyLimit: quantity.toString(),
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setErr("Error in transaction processing.");
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
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <h3 className="mb-2 text-lg font-bold">Place in market</h3>

          <div className="mt-4 flex flex-col items-center gap-y-2">
            <div className="flex w-full  max-w-sm flex-col rounded-lg bg-base-200 p-2 py-5">
              <p>Asset Name: {item.name}</p>
              <p>
                Asset Code:{" "}
                <span className="badge badge-primary">
                  {item.nftAsset.code}
                </span>
              </p>
              <p className="text-sm">
                Issuer: {addrShort(item.nftAsset.issuer.pub, 15)}
              </p>
            </div>

            {/* write a component with increment and decrement button for quanity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="btn btn-sm"
              >
                -
              </button>
              <p>{quantity}</p>
              <button
                onClick={() =>
                  quantity < Number(item.copies) && setQuantity(quantity + 1)
                }
                className="btn btn-sm"
              >
                +
              </button>
            </div>

            <div className="w-full max-w-sm">
              {revertNftMutation.isSuccess && (
                <SuccessAlert
                  message={`Your item has successfully been placed in ${env.NEXT_PUBLIC_SITE} Marketplace.`}
                />
              )}
              {err && <ErrorAlert message={err} />}
              {xdrMutaion.isError && (
                <ErrorAlert message={xdrMutaion.error.message} />
              )}
            </div>

            <div className="flex w-full max-w-sm flex-col items-center">
              <button
                disabled={xdrMutaion.isSuccess}
                className="btn btn-success w-full"
                onClick={() => handleXDR()}
              >
                {(xdrMutaion.isLoading || loading) && (
                  <span className="loading loading-spinner"></span>
                )}
                Checkout
              </button>

              <button
                disabled={
                  !xdrMutaion.isSuccess ||
                  revertNftMutation.isSuccess ||
                  xdr === undefined ||
                  err !== undefined
                }
                className="btn btn-success mt-3 w-full"
                onClick={() => {
                  void (async () => {
                    await handleConfirmClick();
                  })();
                }}
              >
                {(submitL || revertNftMutation.isLoading) && (
                  <span className="loading loading-spinner" />
                )}
                Confirm
              </button>
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => resetState()}>
                Close
              </button>
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
        Buy Back
      </button>
    </>
  );
}
