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
import Loading from "~/components/wallete/loading";

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
  limit: z.number().min(1).nonnegative(),
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

  if (requiredToken.isLoading) return <Loading />;

  if (requiredToken.data) {
    if (platformAssetBalance < requiredToken.data) {
      return (
        <Alert
          className="max-w-lg"
          type={"error"}
          content={`To create this page asset, you'll need ${requiredToken.data} ${PLATFROM_ASSET.code} for your Asset account.`}
        />
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
  const [tostId, setToastId] = React.useState<string>();

  const { pubkey, walletType, needSign } = useConnectWalletStateStore();
  const mutation = api.fan.member.createCreatePageAsset.useMutation({
    onSuccess: () => {
      reset();
    },
  });

  // const assetAmount = api.fan.trx.getAssetNumberforXlm.useQuery();

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
                issuer: data.escrow,
                limit: getValues("limit"),
              });
            } else {
              toast.error("Error signing transaction");
            }
          })
          .catch((e) => console.log(e))
          .finally(() => {
            setIsModalOpen(false);
            toast.error("Error while getting xdr", { id: tostId });
          });
      } else {
        toast.error("Error in stellar horizon", { id: tostId });
      }

      toast.error("Error while getting xdr", { id: tostId });
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

    setToastId(toast.loading("Creating page asset"));

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

              <div className="max-w-xs">
                <Alert
                  type={mutation.error ? "warning" : "noraml"}
                  content={`To create this page token, you'll need ${requiredToken} ${PLATFROM_ASSET.code} for your Asset account. Additionally, there's a platform fee of ${PLATFROM_FEE} ${PLATFROM_ASSET.code}. Total: ${requiredToken + Number(PLATFROM_FEE)}`}
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
