import { clientsign } from "package/connect_wallet/src/lib/stellar/utils";
import { useRef } from "react";
import { api } from "~/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";
import { ValidCreateCreator } from "~/pages/fans/creator";

export const PlaceMarketFormSchema = z.object({
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

export type PlaceMarketFormType = z.TypeOf<typeof PlaceMarketFormSchema>;

export default function StorageCreateDialog({
  item,
}: {
  item: { code: string; issuer: string; copies: number; name: string };
}) {
  const storage = api.admin.user.hasStorage.useQuery();

  if (storage.data) {
    const storagePub = storage.data.storage;
    if (storagePub) {
      return <PlaceNFT2StorageModal item={item} />;
    } else {
      // create storage
      return <StorageCreate />;
    }
  }
}

function StorageCreate() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Place in storage (*)</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Need to Create Storage Account</DialogTitle>
          <DialogDescription>
            First you need to create your storage account , then try placing the
            item to the storage
          </DialogDescription>
        </DialogHeader>
        <ValidCreateCreator message="No storage account. Create one" />;
      </DialogContent>
    </Dialog>
  );
}

function PlaceNFT2StorageModal({
  item,
}: {
  item: {
    code: string;
    issuer: string;
    copies: number;
    name: string;
  };
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
  } = useForm<z.infer<typeof PlaceMarketFormSchema>>({
    resolver: zodResolver(PlaceMarketFormSchema),
    defaultValues: { code: item.code, issuer: item.issuer, placingCopies: 1 },
  });

  const xdrMutation = api.marketplace.market.placeNft2StorageXdr.useMutation({
    onSuccess(data, variables, context) {
      const xdr = data;
      // console.log(xdr, "...");

      const tostId = toast.loading("Signing transaction...");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id,
        walletType: session.data?.user.walletType,
        test: clientSelect(),
      })
        .then((res) => {
          const data = getValues();
          if (res) toast.success("NFT has been placed to storage");
        })
        .catch((e) => {
          console.log(e);
          toast.error("Error signing transaction");
        })
        .finally(() => toast.dismiss(tostId));
    },
  });

  function resetState() {
    reset();
    xdrMutation.reset();
  }

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const onSubmit: SubmitHandler<z.infer<typeof PlaceMarketFormSchema>> = (
    data,
  ) => {
    const placingCopies = getValues("placingCopies");
    if (placingCopies <= item.copies) {
      xdrMutation.mutate({
        issuer: item.issuer,
        placingCopies: getValues("placingCopies"),
        code: item.code,
        signWith: needSign(),
      });
    } else {
      toast.error("You can't place more copies than available");
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
          <h3 className="mb-2 text-lg font-bold">Place in storage</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 flex flex-col items-center gap-y-2">
              <div className="flex w-full  max-w-sm flex-col rounded-lg bg-base-200 p-2 py-5">
                <p>Asset Name: {item.name}</p>
                <p>
                  Asset Code:{" "}
                  <span className="badge badge-primary">{item.code}</span>
                </p>
                {/* <p className="">Price: {item.price} XLM</p> */}
                <p className="text-sm text-error">Items left: {item.copies}</p>
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
                  {...register("placingCopies", {
                    valueAsNumber: true,
                    max: item.copies,
                  })}
                  min={1}
                  step={1}
                  className="input input-sm input-bordered  w-full"
                  placeholder="How many copy you want to place to market?"
                />
                {errors.placingCopies && (
                  <label className="label">
                    <span className="label-text text-error">
                      {errors.placingCopies.message}
                    </span>
                  </label>
                )}
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

              <div className=" flex w-full max-w-sm flex-col items-center">
                <button
                  disabled={xdrMutation.isSuccess}
                  className="btn btn-primary  w-full"
                >
                  {xdrMutation.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Submit
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
        className="btn btn-secondary btn-sm my-2 w-full transition duration-500 ease-in-out"
        onClick={handleModal}
      >
        Place item for sale
      </Button>
    </>
  );
}
