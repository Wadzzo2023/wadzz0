import { useRef } from "react";
import { api } from "~/utils/api";
import { useConnectWalletStateStore } from "package/connect_wallet";
import { clientsign } from "package/connect_wallet";

import { z } from "zod";

import { addrShort } from "~/lib/utils";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSelect } from "~/lib/stellar/fan/utils";

export const BackMarketFormSchema = z.object({
  placingCopies: z.number().nonnegative().int(),
  code: z
    .string()
    .min(4, { message: "Minimum 4 char" })
    .max(12, { message: "Maximum 12 char" }),
  issuer: z.string(),
});

type PlaceMarketFormType = z.TypeOf<typeof BackMarketFormSchema>;

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
  } = useForm<z.infer<typeof BackMarketFormSchema>>({
    resolver: zodResolver(BackMarketFormSchema),
    defaultValues: { code: item.code, issuer: item.issuer, placingCopies: 1 },
  });

  // const placeItem = api.marketplace.market.placeToMarketDB.useMutation();
  const xdrMutaion = api.marketplace.market.placeBackNftXdr.useMutation({
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
            // placeItem.mutate(data);
          })
          .catch((e) => console.log(e));
      }

      const formData = getValues();
      // res && addMutation.mutate(data);
      // placeItem.mutate(formData);
      // toast.success("NFT has been placed in market");
    },
  });

  function resetState() {}

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const onSubmit: SubmitHandler<z.infer<typeof BackMarketFormSchema>> = (
    data,
  ) => {
    xdrMutaion.mutate({
      issuer: item.issuer,
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
        Back
      </button>
    </>
  );
}
