import { clientsign } from "package/connect_wallet";
import { useRef } from "react";
import { api } from "~/utils/api";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";
import { Button } from "~/components/shadcn/ui/button";

export const BackMarketFormSchema = z.object({
  placingCopies: z
    .number({
      required_error: "Placing Copies  must be a number",
      invalid_type_error: "Placing Copies must be a number",
    })
    .nonnegative()
    .int(),
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" }),
  issuer: z.string(),
});

type PlaceMarketFormType = z.TypeOf<typeof BackMarketFormSchema>;

export default function NftBackModal({
  item,
  copy,
}: {
  item: { code: string; issuer: string };
  copy: number;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const session = useSession();
  const { needSign } = useNeedSign();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    control,
    reset,
  } = useForm<z.infer<typeof BackMarketFormSchema>>({
    resolver: zodResolver(BackMarketFormSchema),
    defaultValues: { code: item.code, issuer: item.issuer, placingCopies: 1 },
  });

  // const placeItem = api.marketplace.market.placeToMarketDB.useMutation();
  const xdrMutaion = api.marketplace.market.placeBackNftXdr.useMutation({
    onSuccess(data, variables, context) {
      const xdr = data;
      const tostId = toast.loading("Signing transaction...");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id,
        walletType: session.data?.user.walletType,
        test: clientSelect(),
      })
        .then((res) => {
          if (res) {
            toast.success("Success");
          } else {
            toast.error("Failed");
          }
        })
        .catch((e) => console.log(e))
        .finally(() => toast.dismiss(tostId));
    },
  });

  function resetState() {
    // console.log("hi");
    reset();
    xdrMutaion.reset();
  }

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const onSubmit: SubmitHandler<z.infer<typeof BackMarketFormSchema>> = (
    data,
  ) => {
    if (copy > getValues("placingCopies")) {
      xdrMutaion.mutate({
        issuer: item.issuer,
        placingCopies: getValues("placingCopies"),
        code: item.code,
        signWith: needSign(),
      });
    } else {
      toast.error("You can't take more than you have");
    }
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
          <h3 className="mb-2 text-lg font-bold">
            Take Asset Back From Storage to Main Acc
          </h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 flex flex-col items-center gap-y-2">
              <div className="flex w-full  max-w-sm flex-col rounded-lg bg-base-200 p-2 py-5">
                <p>Asset Name: {item.code}</p>
                <p>
                  Asset Code:{" "}
                  <span className="badge badge-primary">{item.code}</span>
                </p>
                {/* <p className="">Price: {item.price} XLM</p> */}
                <p className="text-sm text-error">Items left: {copy}</p>
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
                  className="input input-sm input-bordered  w-full"
                  placeholder="How many copy you want to place to market?"
                />
              </div>

              <div className="flex w-full max-w-sm flex-col items-center">
                <button
                  disabled={xdrMutaion.isSuccess}
                  className="btn btn-primary w-full"
                >
                  {xdrMutaion.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Proceced
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
      <Button
        className="btn btn-outline btn-sm my-2 w-full transition duration-500 ease-in-out"
        onClick={handleModal}
      >
        Remove from market
      </Button>
    </>
  );
}
