import React, { ReactNode, useRef, useState } from "react";
import Modal from "./modal_template";
import ModalButton from "../button/add_button";
import { CheckCircle2, PlusIcon, Variable, XCircle } from "lucide-react";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import albedo from "@albedo-link/intent";
import { env } from "~/env";
import { checkAssetBalance } from "~/lib/stellar/trx/create_song_token";
import { error } from "console";
import { ErrorAlert } from "../alert/error";
import { SuccessAlert } from "../alert/success";
import {
  DEFAULT_ASSET_LIMIT,
  STORAGE_PUB,
} from "~/lib/stellar/wallete/constant";
import { addrShort } from "~/lib/utils";
import { WalletType } from "~/lib/enums";
import log from "~/lib/logger/logger";
import axios from "axios";
import { z } from "zod";
import { useSongStore } from "~/lib/states/songs";
import { Balance4, useBalanceStore } from "~/lib/states/storageAcc";
import { Song } from "~/lib/types/dbTypes";

type BuyModalProps = {
  item: Song;
  // button: ReactNode;
};
export default function BuyModal({
  item,
  // copies,
}: BuyModalProps) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();

  const [xdr, setXdr] = useState<string>();
  const createAlbumModal = useRef<HTMLDialogElement>(null);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [submitL, setsLoad] = useState(false);

  const { id: songId, songAsset } = item;
  const issuerPub = songAsset!.issuer.pub;
  const { code: assetCode, price, limit } = songAsset!;

  // aviable copies are the balance of storage
  const copies = useBalanceStore((state) =>
    state.getAssetBalance({
      code: item.songAsset?.code,
      issuer: item.songAsset?.issuer.pub,
      limit: true,
      for: Balance4.STORAGE,
    }),
  );

  const xdrMutaion = api.steller.getPaymentXDR.useMutation({
    onSuccess: (data, Variable) => {
      if (data) setXdr(data);
    },
    onError: () => {
      setsLoad(false);
    },
  });
  const utils = api.useContext();
  const songAddMutation = api.user.addSong.useMutation({
    async onSuccess(data, variables, context) {
      await utils.steller.getStorageBalances.invalidate();
    },
  });

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
          // save to store this state to firebase.
          songAddMutation.mutate({ pubkey, songId });
        } else {
          toast("Payment is not successfull, Try again");
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
            songAddMutation.mutate({ pubkey, songId });
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
      const balance = await checkAssetBalance({
        storagePub: STORAGE_PUB,
        assset: { code: assetCode, issuer: issuerPub },
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
                assetCode,
                issuerPub,
                price,
                limit,
                secret: secretKey,
              });
            } else {
              setErr("email and uid not found");
            }
          } else {
            xdrMutaion.mutate({
              pubkey,
              assetCode,
              issuerPub,
              price,
              limit,
            });
          }
        } else {
          setErr("This asset is not available for sell");
          log.info("here", balance);
        }
      } else {
        setErr("There are some problem, this asset can not be buyed");
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
                Asset Name:{" "}
                <span className="badge badge-primary">{assetCode}</span>
              </p>
              <p className="text-warning">Price: {price} XLM</p>
              <p className="text-sm text-accent">Copies available: {copies}</p>
              <p className="text-sm">Issuer: {addrShort(issuerPub, 15)}</p>
            </div>

            <div>
              {songAddMutation.isSuccess && (
                <SuccessAlert message="You have succesfull bought this nft song, you will find this in your home page" />
              )}
              {err && <ErrorAlert message={err} />}
              {xdrMutaion.isError && (
                <ErrorAlert message={xdrMutaion.error.message} />
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
                  Checkout for {assetCode}
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
