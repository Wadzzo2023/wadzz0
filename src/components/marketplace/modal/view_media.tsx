import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import { Maximize } from "lucide-react";
import Image from "next/image";

type PlaceMarketModalProps = {
  // item: NFT;
  // button: ReactNode;
  imgUri: string;
};
export default function ViewMediaModal({ imgUri }: PlaceMarketModalProps) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const modal = useRef<HTMLDialogElement>(null);

  function resetState() {
    // modal.current?.close();
  }

  const handleModal = () => {
    modal.current?.showModal();
  };

  return (
    <>
      <dialog className="modal" ref={modal}>
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

          <div className="flex justify-center p-2">
            <div className="relative h-96 w-full max-w-md">
              <Image src={imgUri} fill alt="main image" />
            </div>
          </div>

          {/* <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => resetState()}>
                Close
              </button>
            </form>
          </div> */}
        </div>
      </dialog>

      <Maximize onClick={() => handleModal()} />
    </>
  );
}
