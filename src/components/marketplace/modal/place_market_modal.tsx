import { useRef } from "react";
import { api } from "~/utils/api";

import { z } from "zod";

import { addrShort } from "~/lib/utils";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

export const PlaceMarketFormSchema = z.object({
  code: z
    .string()
    .min(4, { message: "Minimum 4 char" })
    .max(12, { message: "Maximum 12 char" }),
  issuer: z.string().min(56, { message: "Invalid issuer" }),
  price: z.number().nonnegative(),
});

export type PlaceMarketFormType = z.TypeOf<typeof PlaceMarketFormSchema>;

export default function EnableInMarket({
  item,
}: {
  item: { code: string; issuer: string };
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof PlaceMarketFormSchema>>({
    resolver: zodResolver(PlaceMarketFormSchema),
    defaultValues: { code: item.code, issuer: item.issuer },
  });

  function resetState() {
    console.log("hi");
  }

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const enable = api.marketplace.market.placeToMarketDB.useMutation({
    onSuccess: () => {
      toast.success("Placed in market");
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof PlaceMarketFormSchema>> = (
    data,
  ) => {
    enable.mutate(data);
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
          <h3 className="mb-2 text-lg font-bold">Enable in market</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 flex flex-col items-center gap-y-2">
              <div className="flex w-full  max-w-sm flex-col rounded-lg bg-base-200 p-2 py-5">
                <p>Asset Name: {item.code}</p>
                <p>
                  Asset Code:{" "}
                  <span className="badge badge-primary">{item.code}</span>
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

              <div className="flex w-full max-w-sm flex-col items-center">
                <button
                  disabled={enable.isSuccess}
                  className="btn btn-success w-full"
                >
                  {enable.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Enable to Market
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
