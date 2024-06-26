import { useRef, useState } from "react";
import { api } from "~/utils/api";

import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
import toast from "react-hot-toast";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { Location } from "@prisma/client";

type ClaimModalProps = {
  location: Location;
};
export default function ClaimPinModal({ location }: ClaimModalProps) {
  const session = useSession();
  const { needSign } = useNeedSign();

  const modal = useRef<HTMLDialogElement>(null);
  const [xdr, setXdr] = useState<string>();

  const xdrMutation = api.maps.trx.getClaimXDR.useMutation({
    onSuccess: (data, Variable) => {
      setXdr(data);
      return;
    },
  });

  const handleModal = () => {
    modal.current?.showModal();
  };

  async function handleXDR() {
    if (location.claimAmount) {
      xdrMutation.mutate({
        signWith: needSign(),
        locationId: location.id,
      });
    } else {
      toast("Not Claimable");
    }
  }

  if (location.assetId ?? location.claimAmount) return <p>Not Claimable</p>;

  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div>
            <Buy />
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
        CLAIM
      </button>
    </>
  );

  function Buy() {
    return (
      <div>
        <h3 className="mb-2 text-lg font-bold">BUY</h3>

        <div className="flex flex-col items-center gap-y-2">
          <div className="flex flex-col  bg-base-300 p-10"></div>

          <div className="flex flex-col items-center">
            {xdr ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    clientsign({
                      presignedxdr: xdr,
                      pubkey: session.data?.user.id,
                      walletType: session.data?.user.walletType,
                      test: clientSelect(),
                    })
                      .then((res) => {
                        if (res) toast.success("Payment Success");
                      })
                      .catch((e) => console.log(e));
                  }}
                >
                  Confirm Claimant
                </button>
                <button></button>
              </>
            ) : (
              <button
                disabled={xdrMutation.isSuccess}
                className="btn btn-secondary"
                onClick={() => handleXDR()}
              >
                {xdrMutation.isLoading && (
                  <div>
                    <span className="loading"></span>
                  </div>
                )}
                Procced
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
