import { ShopAsset } from "@prisma/client";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import React, { useRef } from "react";
import toast from "react-hot-toast";
import { Asset } from "stellar-sdk";
import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";
import { ShopItemProps } from "../creator/shop";

export default function BuyItemModal({ item }: { item: ShopItemProps }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // get buy xdr

  const handleModal = () => {
    modalRef.current?.showModal();
    isModalOpen ? setIsModalOpen(false) : setIsModalOpen(true);
  };

  return (
    <>
      <button className="btn btn-secondary" onClick={handleModal}>
        Buy
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          {isModalOpen && <ModalContent item={item} />}
          <div
            className="modal-action"
            onClick={() => modalRef.current?.close()}
          >
            <form method="dialog">
              <button className="btn" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

function ModalContent({ item }: { item: ShopItemProps }) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();

  const {
    data: xdr,
    isError,
    error,
    isLoading,
  } = api.trx.buyAssetTrx.useQuery(
    {
      code: item.asset.code,
      issuer: item.asset.issuer,
    },
    { refetchOnWindowFocus: false },
  );

  function handleSubmit() {
    if (xdr)
      clientsign({
        presignedxdr: xdr,
        pubkey,
        walletType,
        test: true,
      })
        .then((res) => {
          if (res) {
            toast.success("Transaction success");
          } else {
            toast.error("Transaction failed");
          }
        })
        .catch((e) => console.log(e));
  }

  return (
    <div>
      <h3 className="text-lg font-bold">Hello! {truncateString(pubkey)} </h3>
      <p>{item.asset.code}</p>
      {xdr && <p>{truncateString(xdr, 10, 5)}</p>}
      <p>
        {item.asset.code}-{truncateString(item.asset.issuer)}
      </p>
      {isError && <p>{error.message}</p>}
      {xdr && (
        <button className="btn" onClick={handleSubmit}>
          Confirm
        </button>
      )}
    </div>
  );
}
