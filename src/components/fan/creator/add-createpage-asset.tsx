import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { Plus } from "lucide-react";
import Alert from "../../ui/alert";
import { PLATFROM_ASSET, PLATFROM_FEE } from "~/lib/stellar/fan/constant";
import { useUserStellarAcc } from "~/lib/state/wallete/userAccBalances";

export const CreatorPageAssetSchema = z.object({
  code: z
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
  price: z.number().min(1).nonnegative(),
  limit: z.number().min(1).nonnegative(),
  description: z.string().min(20, { message: "Make description longer" }),
});

export default function AddCreatorPageAssetModal({
  creator,
}: {
  creator: Creator;
}) {
  const { platformAssetBalance } = useUserStellarAcc();

  const requiredToken = api.fan.trx.getPlatformTokenPriceForXLM.useQuery({
    xlm: 2,
  });

  // console.log(platformAssetBalance, "....vong..", requiredToken.data);

  if (requiredToken.isLoading) return <div> Loading requiredToken</div>;

  if (requiredToken.data) {
    if (platformAssetBalance < requiredToken.data) {
      return (
        <div className="text-red-500">
          You need more balance to create this page asset
        </div>
      );
    } else {
      return (
        <AddCreatorPageAssetModalFrom
          requiredToken={requiredToken.data}
          creator={creator}
        />
      );
    }
  }
  return <p>some errro</p>;
}

function AddCreatorPageAssetModalFrom({
  creator,
  requiredToken,
}: {
  creator: Creator;
  requiredToken: number;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { pubkey, walletType, needSign } = useConnectWalletStateStore();
  const mutation = api.fan.member.createCreatePageAsset.useMutation({
    onSuccess: () => {
      reset();
    },
  });

  const assetAmount = api.fan.trx.getAssetNumberforXlm.useQuery();

  const trxMutation = api.fan.trx.createCreatorPageAsset.useMutation({
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
                code: getValues("code"),
                description: getValues("description") || "No description",
                issuer: data.escrow,
                limit: getValues("limit"),
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
  } = useForm<z.infer<typeof CreatorPageAssetSchema>>({
    resolver: zodResolver(CreatorPageAssetSchema),
    defaultValues: {},
  });

  const onSubmit: SubmitHandler<z.infer<typeof CreatorPageAssetSchema>> = (
    data,
  ) => {
    setIsModalOpen(true);

    trxMutation.mutate({
      code: getValues("code"),
      signWith: needSign(),
      limit: getValues("limit"),
    });
    // mutation.mutate(data);
  };

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button className="btn  btn-primary" onClick={handleModal}>
        <Plus />
        Add Page Asset
      </button>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="mb-4 text-center text-lg font-bold">
            Create Page Asset
          </h3>
          <div className="w-full">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col items-center  gap-2 rounded-md bg-base-300 py-8"
            >
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Page Asset Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Enter Page Asset Code"
                  {...register("code")}
                  className="input input-bordered w-full max-w-xs"
                />
                {errors.code && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.code.message}
                    </span>
                  </div>
                )}
              </label>

              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Limit</span>
                </div>
                <input
                  type="number"
                  {...register("limit", { valueAsNumber: true })}
                  min={1}
                  step={1}
                  className="input input-bordered input-sm  w-full"
                  placeholder="How many copy you want to place to market?"
                />
                {errors.limit && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.limit.message}
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
                  {...register("description")}
                  className="textarea textarea-bordered h-24"
                  placeholder="Description of your page asset"
                ></textarea>
                {errors.description && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.description.message}
                    </span>
                  </div>
                )}
              </label>
              <div className="max-w-xs">
                <Alert
                  type={mutation.error ? "warning" : "noraml"}
                  content={`To create this page token, you'll need ${requiredToken} ${PLATFROM_ASSET.code} for your Asset account. Additionally, there's a platform fee of ${PLATFROM_FEE} ${PLATFROM_ASSET.code}. Total: ${assetAmount.data ?? 1 + Number(PLATFROM_FEE)}`}
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
