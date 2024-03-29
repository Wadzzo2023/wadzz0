import { Creator, Subscription } from "@prisma/client";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";

import { PLATFROM_ASSET, PLATFROM_FEE } from "~/lib/stellar/fan/constant";
import MemberShipCard, { getColor } from "./card";
import clsx from "clsx";
import Alert from "../../ui/alert";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { SubscriptionType } from "~/pages/fans/creator/[id]";

export default function SubscribeMembership({
  subscription,
  disabled,
  creator,
}: {
  subscription: SubscriptionType;
  disabled?: boolean;
  creator: Creator;
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
        className={clsx(
          "btn w-full",
          // "btn-secondary",
          `btn-${getColor(subscription.priority)}`,
        )}
        disabled={disabled}
        onClick={handleModal}
      >
        Subscribe
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          {isModalOpen && (
            <ModalContent creator={creator} subscription={subscription} />
          )}
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

function ModalContent({
  subscription,
  creator,
}: {
  subscription: SubscriptionType;
  creator: Creator;
}) {
  const { isAva, pubkey, walletType, uid, email, needSign } =
    useConnectWalletStateStore();
  const [trxMsg, setTrxMsg] = useState<string>();
  const subscribe = api.fan.member.subscribe.useMutation();
  const xdrMutation = api.fan.trx.clawbackAssetPaymentTrx.useMutation({
    onSuccess(data, variables, context) {
      if (data) {
        clientsign({
          walletType,
          presignedxdr: data,
          pubkey,
          test: clientSelect(),
        })
          .then((res) => {
            if (res) {
              toast.success("popup success");
              subscribe.mutate({
                subscriptionId: subscription.id,
                creatorId: creator.id,
                days: subscription.days,
              });
              setTrxMsg(undefined);
            } else {
              setTrxMsg(
                "Transaction failed. Please check your account balance to ensure that you have sufficient ACTION TOKEN and XLM available.",
              );
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    },
  });

  return (
    <div>
      <h3 className="text-center text-lg font-bold">Subscribe Asset</h3>
      <div className="flex flex-col items-center gap-1 rounded-lg bg-base-300 p-4">
        <MemberShipCard creator={creator} subscription={subscription} />
        <div className="my-2 max-w-xs">
          <Alert content="You have to pay an additional platform fee of 500 actions" />
        </div>

        {xdrMutation.isError && (
          <div className="my-2 max-w-xs">
            <Alert type="error" content={xdrMutation.error.message} />
          </div>
        )}
        {trxMsg && <Alert className="max-w-xs" type="error" content={trxMsg} />}
        <button
          className="btn btn-outline btn-primary  mt-4  w-full max-w-xs"
          onClick={() => {
            xdrMutation.mutate({
              code: subscription.code,
              issuer: subscription.issuer,
              signWith: needSign(),
              creatorId: subscription.creatorId,
              price: subscription.price,
            });
          }}
        >
          {xdrMutation.isLoading && (
            <span className="loading loading-spinner" />
          )}
          Confirm
        </button>
      </div>
    </div>
  );
}
