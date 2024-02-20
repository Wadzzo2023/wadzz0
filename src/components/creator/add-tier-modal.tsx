import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";
import {
  clientsign,
  needSign,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import { AccounSchema, clientSelect } from "~/lib/stellar/utils";
import { Plus } from "lucide-react";
import CollapseSible from "../ui/collapse";
import Alert from "../ui/alert";
import { PLATFROM_ASSET, PLATFROM_FEE } from "~/lib/stellar/constant";

export const TierSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Minimum 4 charecter" })
    .max(12, { message: "Maximum 12 charecter" })
    .refine(
      (value) => {
        // Check if the input is a single word
        return /^\w+$/.test(value);
      },
      {
        message: "Input must be a single word",
      },
    ),
  price: z.number().min(1),
  featureDescription: z
    .string()
    .min(20, { message: "Make description longer" }),
});

export default function AddTierModal({ creator }: { creator: Creator }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { pubkey, walletType, needSign } = useConnectWalletStateStore();
  const mutation = api.member.createMembership.useMutation({
    onSuccess: () => {
      reset();
    },
  });
  const assetAmount = api.trx.getAssetNumberforXlm.useQuery();

  const trxMutation = api.trx.clawbackAssetCreationTrx.useMutation({
    onSuccess: async (data) => {
      if (data) {
        // sign the transaction for fbgoogle

        clientsign({
          walletType,
          presignedxdr: data.trx,
          pubkey,
          test: clientSelect(),
        })
          .then((res) => {
            if (res) {
              toast.success("popup success");
              mutation.mutate({
                name: getValues("name"),
                featureDescription:
                  getValues("featureDescription") || "No description",
                escrow: data.escrow,
                price: getValues("price"),
              });
            } else {
              toast.error("Error signing transaction");
            }
          })
          .catch((e) => console.log(e))
          .finally(() => {
            setIsModalOpen(false);
          });
      } else {
        toast.error("Error creating tier");
      }
      setIsModalOpen(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<z.infer<typeof TierSchema>>({
    resolver: zodResolver(TierSchema),
    defaultValues: {},
  });

  const onSubmit: SubmitHandler<z.infer<typeof TierSchema>> = (data) => {
    setIsModalOpen(true);

    trxMutation.mutate({
      code: getValues("name"),
      signWith: needSign(walletType),
    });
    // mutation.mutate(data);
  };

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button className="btn  btn-secondary" onClick={handleModal}>
        <Plus />
        Add Tier
      </button>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="mb-4 text-center text-lg font-bold">
            Create a subscription tier!
          </h3>
          <div className="w-full">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col items-center  gap-2 rounded-md bg-base-300 py-8"
            >
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Name of the tier"
                  {...register("name")}
                  className="input input-bordered w-full max-w-xs"
                />
                {errors.name && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.name.message}
                    </span>
                  </div>
                )}
              </label>

              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Price</span>
                </div>
                <input
                  {...register("price", { valueAsNumber: true })}
                  className="input input-bordered w-full max-w-xs"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Price"
                ></input>
                {errors.price && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.price.message}
                    </span>
                  </div>
                )}
              </label>

              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Features</span>
                </div>
                <textarea
                  {...register("featureDescription")}
                  className="textarea textarea-bordered h-24"
                  placeholder="What does this tier offer?"
                ></textarea>
                {errors.featureDescription && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.featureDescription.message}
                    </span>
                  </div>
                )}
              </label>
              <div className="max-w-xs">
                <Alert
                  type={mutation.error ? "warning" : "noraml"}
                  content={`To create a Tier, you'll need ${assetAmount.data} ${PLATFROM_ASSET.code} for your Asset account. Additionally, there's a platform fee of ${PLATFROM_FEE} ${PLATFROM_ASSET.code}. Total: ${assetAmount.data ?? 1 + Number(PLATFROM_FEE)}`}
                />
              </div>
              <button
                className="btn btn-primary mt-2 w-full max-w-xs"
                type="submit"
                disabled={mutation.isLoading}
              >
                {(mutation.isLoading || isModalOpen) && (
                  <span className="loading loading-spinner"></span>
                )}
                Create Tier
              </button>
            </form>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
