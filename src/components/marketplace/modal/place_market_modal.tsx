import React, { ReactNode, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useConnectWalletStateStore } from "package/connect_wallet";
import { clientsign } from "package/connect_wallet/src/lib/stellar/utils";

import { z } from "zod";

import { addrShort } from "~/lib/marketplace/utils";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSelect } from "~/lib/stellar/fan/utils";
import toast from "react-hot-toast";

export const PlaceMarketFormSchema = z.object({
  price: z.number().nonnegative(),
  placingCopies: z.number().nonnegative().int(),
  code: z
    .string()
    .min(4, { message: "Minimum 4 char" })
    .max(12, { message: "Maximum 12 char" }),
  issuer: z.string(),
});

type PlaceMarketFormType = z.TypeOf<typeof PlaceMarketFormSchema>;

export default function PlaceMarketModal({
  item,
}: {
  item: { code: string; issuer: string; copies: number };
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const { pubkey, walletType, needSign } = useConnectWalletStateStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof PlaceMarketFormSchema>>({
    resolver: zodResolver(PlaceMarketFormSchema),
  });

  const placeItem = api.marketplace.market.placeToMarketDB.useMutation();
  const xdrMutaion = api.marketplace.market.placeNft2MarketXdr.useMutation({
    onSuccess(data, variables, context) {
      if (false) {
        const xdr = data;
        clientsign({
          presignedxdr: xdr,
          pubkey,
          walletType,
          test: clientSelect(),
        })
          .then((res) => {
            const data = getValues();
            // res && addMutation.mutate(data);
            placeItem.mutate(data);
          })
          .catch((e) => console.log(e));
      }

      const formData = getValues();
      // res && addMutation.mutate(data);
      placeItem.mutate(formData);
      toast.success("NFT has been placed in market");
    },
  });

  function resetState() {}

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const onSubmit: SubmitHandler<z.infer<typeof PlaceMarketFormSchema>> = (
    data,
  ) => {
    xdrMutaion.mutate({
      issuer: item.issuer,
      price: getValues("price"),
      placingCopies: getValues("placingCopies"),
      code: item.code,
      signWith: needSign(),
    });
  };

  return (
    <>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <h3 className="mb-2 text-lg font-bold">Place in market</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 flex flex-col items-center gap-y-2">
              <div className="flex w-full  max-w-sm flex-col rounded-lg bg-base-200 p-2 py-5">
                <p>Asset Name: {item.code}</p>
                <p>
                  Asset Code:{" "}
                  <span className="badge badge-primary">{item.code}</span>
                </p>
                {/* <p className="">Price: {item.price} XLM</p> */}
                <p className="text-sm text-primary">
                  Items left: {item.copies}
                </p>
                <p className="text-sm">Issuer: {addrShort(item.issuer, 15)}</p>
              </div>

              <div className="w-full max-w-sm">
                <label className="label">
                  <span className="label-text">Price</span>
                  <span className="label-text-alt">Price will be set in</span>
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("price", { valueAsNumber: true })}
                  required={true}
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
                  {...register("placingCopies", { valueAsNumber: true })}
                  min={1}
                  step={1}
                  className="input input-bordered input-sm  w-full"
                  placeholder="How many copy you want to place to market?"
                />
              </div>

              {/* <div className="w-full max-w-sm">
                {placeNftMutation.isSuccess && (
                  <Alert
                    type="success"
                    content={`Your item has successfully been placed in ${env.NEXT_PUBLIC_SITE} Marketplace.`}
                  />
                )}
                {err && <Alert message={err} />}
                {xdrMutaion.isError && (
                  <Alert message={xdrMutaion.error.message} />
                )}
              </div> */}

              <div className="flex w-full max-w-sm flex-col items-center">
                <button
                  disabled={xdrMutaion.isSuccess}
                  className="btn btn-success w-full"
                >
                  {xdrMutaion.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Checkout
                </button>

                {/* <button
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
                </button> */}
              </div>
            </div>
          </form>
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
