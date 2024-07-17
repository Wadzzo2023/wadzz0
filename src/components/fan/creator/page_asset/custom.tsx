import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

export const CreatorCustomPageAssetSchema = z.object({
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" })
    .refine(
      (value) => {
        return /^\w+$/.test(value);
      },
      {
        message: "Input must be a single word",
      },
    ),
  issuer: z.string().length(56),
});

function CustomPageAssetFrom({ requiredToken }: { requiredToken: number }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [signLoading, setSignLoading] = React.useState(false);
  const [xdr, setXDR] = React.useState<string>();

  const session = useSession();
  const { needSign } = useNeedSign();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm<z.infer<typeof CreatorCustomPageAssetSchema>>({
    resolver: zodResolver(CreatorCustomPageAssetSchema),
    defaultValues: {},
  });

  const mutation = api.fan.member.createCustomPageAsset.useMutation({
    onSuccess: () => {
      toast.success("Page Asset Created Successfully");
      reset();
    },
    onError: (error) => {
      toast.error(`error ${error.message}`);
    },
  });

  const xdrMutation = api.fan.trx.trustCustomPageAssetXDR.useMutation({
    onSuccess: (data) => {
      setXDR(data);
    },
    onError: (error) => {
      toast.error(`error ${error.message}`);
    },
  });

  // const assetAmount = api.fan.trx.getAssetNumberforXlm.useQuery();

  const onSubmit: SubmitHandler<
    z.infer<typeof CreatorCustomPageAssetSchema>
  > = (data) => {
    xdrMutation.mutate({ ...data, signWith: needSign() });
  };

  const loading = isModalOpen || mutation.isLoading || signLoading;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center  gap-2 rounded-md bg-base-300 py-8"
    >
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Page Asset Code</span>
        </div>
        <input
          type="text"
          placeholder="Enter page asset code"
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
          <span className="label-text">Issuer</span>
        </div>
        <input
          {...register("issuer")}
          className="input input-bordered  w-full"
          placeholder="Enter issuer address"
        />
        {errors.issuer && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.issuer.message}
            </span>
          </div>
        )}
      </label>

      <div className="max-w-xs">
        <Alert
          type={mutation.error ? "warning" : "noraml"}
          //   content={`To create this page token, you'll need ${requiredToken} ${PLATFROM_ASSET.code} for your Asset account. Additionally, there's a platform fee of ${PLATFROM_FEE} ${PLATFROM_ASSET.code}. Total: ${requiredToken + Number(PLATFROM_FEE)}`}
          content={`You might not be able to change your page asset in future. Please enter the information very carefully`}
        />
      </div>
      <ActionButton />
    </form>
  );

  function ActionButton() {
    if (xdr) {
      return (
        <button
          className="btn btn-primary mt-2 w-full max-w-xs"
          type="button"
          disabled={loading}
          onClick={() => {
            setSignLoading(true);
            clientsign({
              presignedxdr: xdr,
              pubkey: session.data?.user.id,
              walletType: session.data?.user.walletType,
              test: clientSelect(),
            })
              .then((res) => {
                if (res) {
                  mutation.mutate(getValues());
                } else {
                  toast.error("Transaction Failed");
                }
              })
              .catch((e) => console.log(e))
              .finally(() => setSignLoading(false));
          }}
        >
          {loading && <span className="loading loading-spinner"></span>}
          Set Page Asset
        </button>
      );
    } else {
      return (
        <button
          className="btn btn-primary mt-2 w-full max-w-xs"
          type="submit"
          disabled={xdrMutation.isLoading || loading}
        >
          Proceed
        </button>
      );
    }
  }
}

export default CustomPageAssetFrom;
