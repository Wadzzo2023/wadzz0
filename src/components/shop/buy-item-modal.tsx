import { ShopAsset } from "@prisma/client";
import { useConnectWalletStateStore } from "package/connect_wallet";
import React, { useRef } from "react";
import { Asset } from "stellar-sdk";
import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";

export default function BuyItemModal({ item }: { item: ShopAsset }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // get buy xdr

  const handleModal = () => {
    modalRef.current?.showModal();
    isModalOpen ? setIsModalOpen(false) : setIsModalOpen(true);
  };

  const resetState = () => {};

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

function ModalContent({ item }: { item: ShopAsset }) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();

  const {
    data: xdr,
    isError,
    error,
    isLoading,
  } = api.trx.buyAssetTrx.useQuery(
    {
      asset: { code: item.code, issuer: item.issuer },
    },
    { refetchOnWindowFocus: false },
  );

  return (
    <div>
      <h3 className="text-lg font-bold">Hello! {truncateString(pubkey)} </h3>
      <p>{item.code}</p>
      {xdr && <p>{truncateString(xdr, 10, 0)}</p>}
      <p className="py-4">Press ESC key or click the button below to close</p>
      {isError && <p>{error.message}</p>}
    </div>
  );
}
