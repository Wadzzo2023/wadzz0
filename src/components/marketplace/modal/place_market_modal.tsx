import React, { ReactNode, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import { clientsign } from "package/connect_wallet/src/lib/stellar/utils";
import toast from "react-hot-toast";
import albedo from "@albedo-link/intent";
import { env } from "~/env";
import { checkAssetBalance } from "~/lib/stellar/trx/create_song_token";
import { ErrorAlert } from "../alert/error";
import { SuccessAlert } from "../alert/success";
import {
  DEFAULT_ASSET_LIMIT,
  DEFAULT_ASSET_PRICE,
  STORAGE_PUB,
} from "~/lib/stellar/constant";
import { addrShort } from "~/lib/utils";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import log from "~/lib/logger/logger";
import axios from "axios";
import { z } from "zod";
import { NFT } from "~/lib/types/dbTypes";
import { validateLimit, validatePrice } from "./nft_create";
import { Balance4, useBalanceStore } from "~/lib/states/storageAcc";

type PlaceMarketModalProps = {
  item: NFT;
  // button: ReactNode;
};
export default function PlaceMarketModal({ item }: PlaceMarketModalProps) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const [xdr, setXdr] = useState<string>();
  const createAlbumModal = useRef<HTMLDialogElement>(null);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [submitL, setsLoad] = useState(false);

  const [price, setPrice] = useState(item.price);
  const [copyL, setL] = useState(1);

  const copies = useBalanceStore((state) =>
    state.getAssetBalance({
      code: item.nftAsset?.code,
      issuer: item.nftAsset?.issuer.pub,
      limit: true,
      for: Balance4.USER,
    }),
  );

  const xdrMutaion = api.steller.getXDR4MarketPlace.useMutation({
    onSuccess: (data, Variable) => {
      // toast.success(`${data}`)
      if (data) setXdr(data);
    },
    onError: () => {
      setsLoad(false);
    },
  });

  // const utils = api.useContext();
  // const nftAddMutation = api.user.addNft.useMutation({
  //   async onSuccess(data, variables, context) {
  //     await utils.steller.getStorageBalances.invalidate();
  //   },
  // });

  const placeNftMutation = api.market.placeNft2Market.useMutation();

  function resetState() {
    setXdr(undefined);
    setErr(undefined);
    setLoading(false);
    setsLoad(false);
    xdrMutaion.reset();
    placeNftMutation.reset();
  }

  const handleModal = () => {
    createAlbumModal.current?.showModal();
  };
  function handleLimitChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const limit = validateLimit(e.target.value);
    const upperLimit = Number(copies) ?? 1;
    if (limit > upperLimit) {
      toast.error("Invalid limit");
    } else {
      setL(limit);
    }
  }

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
          // save to store this state to firebase.
          // songAddMutation.mutate({ pubkey,  });
          // toast.success("payment sucessfull");
          placeNftMutation.mutate({
            copies: copyL,
            nftId: item.id,
            price: validatePrice(price),
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
            placeNftMutation.mutate({
              copies: copyL,
              nftId: item.id,
              price: validatePrice(price),
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

  async function handleXDR() {
    try {
      setLoading(true);
      // for place to marketplace user should have this token.
      const balance = await checkAssetBalance({
        accPub: pubkey,
        assset: { code: item.nftAsset.code, issuer: item.nftAsset.issuer.pub },
      });
      if (balance) {
        if (Number(balance) >= Number(DEFAULT_ASSET_LIMIT)) {
          if (
            // here facebook and google need resolvation
            walletType == WalletType.facebook ||
            walletType == WalletType.google
          ) {
            if (uid && email) {
              // first get secret
              const res = await axios.get(
                "https://accounts.action-tokens.com/api/getAccSecret",
                {
                  params: {
                    uid,
                    email,
                  },
                },
              );
              const secretKeySchema = z.object({
                secretKey: z.string().min(56),
              });

              const { secretKey } = await secretKeySchema.parseAsync(res.data);
              xdrMutaion.mutate({
                pubkey,
                assetCode: item.nftAsset.code,
                issuerPub: item.nftAsset.issuer.pub,
                price: validatePrice(price),
                copyLimit: copyL.toString(),
                secret: secretKey,
              });
            } else {
              setErr("email and uid not found");
            }
          } else {
            xdrMutaion.mutate({
              pubkey,
              assetCode: item.nftAsset.code,
              issuerPub: item.nftAsset.issuer.pub,
              price: validatePrice(price),
              copyLimit: copyL.toString(),
            });
          }
        } else {
          setErr("You do not have enough amount to sell this item.");
          log.info("here", balance);
        }
      } else {
        setErr("You cannot buy this item.");
      }
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
              <p className="">Price: {item.price} XLM</p>
              <p className="text-sm text-primary">Items left: {copies}</p>
              <p className="text-sm">
                Issuer: {addrShort(item.nftAsset.issuer.pub, 15)}
              </p>
            </div>

            <div className="w-full max-w-sm">
              <label className="label">
                <span className="label-text">Price</span>
                <span className="label-text-alt">
                  Price will be set in {env.NEXT_PUBLIC_SITE}
                </span>
              </label>
              <input
                type="number"
                value={Number(price)}
                min={1}
                required={true}
                onChange={(e) => setPrice(e.target.value)}
                className="input input-bordered input-sm  w-full"
                placeholder="Price"
              />
            </div>
            <div className=" w-full max-w-sm ">
              <label className="label">
                <span className="label-text">Quantity</span>
                <span className="label-text-alt">
                  Default quantity would be 1
                </span>
              </label>
              <input
                type="number"
                min={1}
                value={copyL}
                max={copies ?? 1}
                onChange={(e) => handleLimitChange(e)}
                className="input input-bordered input-sm  w-full"
                placeholder="How many copy you want to sell?"
              />
            </div>

            <div className="w-full max-w-sm">
              {placeNftMutation.isSuccess && (
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
                onClick={() => {
                  void (async () => {
                    await handleXDR();
                  })();
                }}
              >
                {(xdrMutaion.isLoading || loading) && (
                  <span className="loading loading-spinner"></span>
                )}
                Checkout
              </button>

              <button
                disabled={
                  !xdrMutaion.isSuccess ||
                  placeNftMutation.isSuccess ||
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
                {(submitL || placeNftMutation.isLoading) && (
                  <span className="loading loading-spinner" />
                )}
                Place item for sale
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
        Place to market
      </button>
    </>
  );
}
