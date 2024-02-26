import albedo from "@albedo-link/intent";
import axios from "axios";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { clientsign } from "package/connect_wallet/src/lib/stellar/utils";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { env } from "~/env";
import log from "~/lib/logger/logger";
import { useNftStore } from "~/lib/states/nfts";
import { useRightStore } from "~/lib/states/right";
import { DEFAULT_ASSET_LIMIT, STORAGE_PUB } from "~/lib/stellar/constant";
import { checkAssetBalance } from "~/lib/stellar/trx/create_song_token";
import { addrShort } from "~/lib/utils";
import { MarketNFT } from "~/server/api/routers/marketplace";
import { api } from "~/utils/api";
import { ErrorAlert } from "../alert/error";
import { SuccessAlert } from "../alert/success";

type BuyModalProps = {
  item: MarketNFT;

  copies?: string;
  // button: ReactNode;
};
export default function BuyModal({ item }: BuyModalProps) {
  const { id, nftAsset } = item;
  const code = item.nftAsset.code;
  const issuer = item.nftAsset.issuer.pub;

  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const { updateNft } = useNftStore();
  const { setRightData } = useRightStore();
  const [xdr, setXdr] = useState<string>();
  const createAlbumModal = useRef<HTMLDialogElement>(null);
  const [err, setErr] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [submitL, setsLoad] = useState(false);

  const { data: hasTrust, isLoading } = api.steller.hasTrust.useQuery({
    pubkey,
    asset: { code, issuer },
  });

  const xdrMutaion = api.steller.getPaymentXDR.useMutation({
    onSuccess: (data, Variable) => {
      if (data) setXdr(data);
    },
    onError: () => {
      setsLoad(false);
    },
  });

  const utils = api.useContext();
  const nftAddMutation = api.user.addNft.useMutation({
    async onSuccess(data, variables, context) {
      await utils.steller.getAccBalances.invalidate();
      const updateItem = item;
      updateItem.copies = updateItem.copies - 1;
      updateNft(updateItem);
      setRightData(updateItem);
      // utils.market.getMarketNft.invalidate();
      await utils.market.getAllNft.invalidate();
      await utils.user.getUserNfts.refetch();
      // await utils.steller.getStorageBalances.invalidate();
    },
  });

  function resetState() {
    setXdr(undefined);
    setErr(undefined);
    setLoading(false);
    setsLoad(false);
    xdrMutaion.reset();
    nftAddMutation.reset();
  }

  const handleModal = () => {
    createAlbumModal.current?.showModal();
  };
  async function handleConfirmClick() {
    if (xdr) {
      if (
        env.NEXT_PUBLIC_STELLAR_PUBNET ||
        walletType == WalletType.google ||
        walletType == WalletType.facebook ||
        walletType == WalletType.emailPass
      ) {
        setsLoad(true);
        const res = await clientsign({ walletType, pubkey, presignedxdr: xdr });
        if (res) {
          // payment succesfull
          // save to store this state to firebase.

          nftAddMutation.mutate({ pubkey, nftId: id, seller: item.ownerAcc });
        } else {
          toast("Payment failed, please try again");
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
            nftAddMutation.mutate({ pubkey, nftId: id, seller: item.ownerAcc });
          })
          .catch((e) => {
            log.info("error", e, false);
          });
      }
    } else {
      toast("Failed to get XDR information.");
    }
  }

  async function handleXDR() {
    try {
      setLoading(true);

      const balance = await checkAssetBalance({
        accPub: STORAGE_PUB,
        assset: { code: code, issuer: issuer },
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

              const secret = await getAccSecret(uid, email);

              xdrMutaion.mutate({
                pubkey,
                assetCode: code,
                issuerPub: issuer,
                price: item.price,
                limit: nftAsset.limit,
                secret,
                sellerAcc: item.ownerAcc,
              });
            } else {
              setErr("email and uid not found");
            }
          } else {
            xdrMutaion.mutate({
              pubkey,
              assetCode: code,
              issuerPub: issuer,
              price: item.price, // here price is in siteAsset, actual price not extra 50
              limit: nftAsset.limit,
              sellerAcc: item.ownerAcc,
            });
          }
        } else {
          setErr("This item is not available for sell");
          log.info("here", balance);
        }
      } else {
        setErr("This item has an issue and cannot be bought.");
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
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <h3 className="mb-2 text-lg font-bold">BUY</h3>

          <div className="flex flex-col content-center items-center gap-y-2">
            <div className="flex w-full flex-col items-center rounded-lg bg-base-200 p-10">
              <p>
                <b>Item Name </b>:{" "}
                <span className="badge badge-neutral uppercase">
                  {item.name}
                </span>
              </p>
              <p className="text-primary">
                <b>Price</b> :
                {hasTrust ? (
                  <span>
                    <del>{Number(item.price) + 50}</del> {item.price}
                  </span>
                ) : (
                  (Number(item.price) + 50).toString()
                )}{" "}
                {env.NEXT_PUBLIC_SITE}
              </p>
              <p className="text-sm text-primary">
                <b>Available </b>: {item.copies}
              </p>
              <p>
                <br></br>
              </p>
              <p>NFT Info :</p>
              <p>
                <b>Asset Name </b>:{" "}
                <span className="badge badge-primary rounded-sm p-2 uppercase">
                  {code}
                </span>
              </p>
              <p className="text-sm">
                <b>Issuer</b>: {addrShort(issuer, 15)}
              </p>
            </div>

            <div className="w-full">
              {nftAddMutation.isSuccess && (
                <SuccessAlert message="You have successfuly bought an item! You'll be able to find it in My Items Tab" />
              )}
              {err && <ErrorAlert message={err} />}
              {xdrMutaion.isError && (
                <ErrorAlert message={xdrMutaion.error.message} />
              )}
            </div>

            <div className="flex  w-full flex-col items-center ">
              <button
                disabled={xdrMutaion.isSuccess}
                className="btn btn-success w-full"
                onClick={() => handleXDR()}
              >
                {(xdrMutaion.isLoading || loading) && (
                  <span className="loading loading-spinner"></span>
                )}
                Checkout for {code}
              </button>

              <button
                disabled={
                  !xdrMutaion.isSuccess ||
                  nftAddMutation.isSuccess ||
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
                {(submitL || nftAddMutation.isLoading) && (
                  <span className="loading loading-spinner"></span>
                )}
                Pay using {env.NEXT_PUBLIC_SITE}.
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
        BUY
      </button>
    </>
  );
}

async function getAccSecret(uid: string, email: string) {
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
  return secretKey;
}
