import { Asset } from "@prisma/client";
import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { PLATFORM_ASSET, PLATFORM_FEE } from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";
import { cn } from "~/utils/utils";

export default function BuyItemModal({
  item,
  btnClassName,
}: {
  item: Asset;
  btnClassName?: string;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // get buy xdr

  const handleModal = () => {
    modalRef.current?.showModal();
    isModalOpen ? setIsModalOpen(false) : setIsModalOpen(true);
  };

  return (
    <>
      <button
        className={cn("btn btn-primary", btnClassName)}
        onClick={handleModal}
      >
        Buy Now
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

function ModalContent({ item }: { item: Asset }) {
  const [trxMsg, setTrxMsg] = useState<string>();
  const session = useSession();

  // TODO: fix this default value
  const price = 10;

  const xdr = api.fan.trx.buyAssetTrx.useMutation({
    onSuccess: (data) => {
      clientsign({
        presignedxdr: data,
        pubkey: session.data?.user.id,
        walletType: session.data?.user.walletType,
        test: clientSelect(),
      })
        .then((res) => {
          if (res) {
            toast.success("Transaction Success");
          }
        })
        .catch((e) => console.log(e));
    },
  });

  function handleSubmit() {
    if (item.creatorId)
      xdr.mutate({
        creatorId: item.creatorId,

        price,
        code: item.code,
        issuer: item.issuer,
      });
  }

  if (xdr.isLoading)
    return (
      <div className="flex items-center justify-center">
        <span className="loading loading-spinner mr-2" /> Getting XDR
      </div>
    );

  if (xdr.isError) return <p className="text-warning">{xdr.error.message}</p>;

  return (
    <div>
      <h3 className="text-center text-lg font-bold">Buy Asset</h3>
      <div className="flex flex-col items-center gap-1 rounded-lg bg-base-300 p-4">
        <div>
          <p>
            Name:
            <span className="badge">{item.code}</span>
          </p>
          {/* {xdr && <p>issuer: {truncateString(xdr.data, 10, 5)}</p>} */}
          <p>Issuer: {truncateString(item.issuer)}</p>
          <p>
            Price: {price} {PLATFORM_ASSET.code}
            <br />
            Platform Fee: {PLATFORM_FEE} {PLATFORM_ASSET.code}
          </p>

          {trxMsg && <p className="text-error">{trxMsg}</p>}

          {xdr && (
            <button
              className="btn btn-outline btn-primary  mt-4"
              onClick={handleSubmit}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
