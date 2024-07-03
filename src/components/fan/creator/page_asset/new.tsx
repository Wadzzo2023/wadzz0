import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { PLATFROM_ASSET, PLATFROM_FEE } from "~/lib/stellar/fan/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

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
  thumbnail: z.string(),
});

function NewPageAssetFrom({ requiredToken }: { requiredToken: number }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [signLoading, setSignLoading] = React.useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCover] = useState<string>();

  // pinta upload
  const [file, setFile] = useState<File>();
  const [ipfs, setCid] = useState<string>();

  const session = useSession();
  const { needSign } = useNeedSign();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm<z.infer<typeof CreatorPageAssetSchema>>({
    resolver: zodResolver(CreatorPageAssetSchema),
    defaultValues: {},
  });

  const mutation = api.fan.member.createCreatePageAsset.useMutation({
    onSuccess: () => {
      toast.success("Page Asset Created Successfully");
      reset();
    },
  });

  // const assetAmount = api.fan.trx.getAssetNumberforXlm.useQuery();

  const trxMutation = api.fan.trx.createCreatorPageAsset.useMutation({
    onSuccess: async (data) => {
      setSignLoading(true);
      // sign the transaction for fbgoogle
      const toastId = toast.loading("Signing Transaction");
      clientsign({
        walletType: session.data?.user.walletType,
        presignedxdr: data.trx,
        pubkey: session.data?.user.id,
        test: clientSelect(),
      })
        .then((res) => {
          if (res) {
            mutation.mutate({
              code: getValues("code"),
              limit: getValues("limit"),
              issuer: data.escrow,
              thumbnail: getValues("thumbnail"),
            });
          } else {
            toast.error("Transaction failed", { id: toastId });
          }
        })
        .catch((e) => {
          toast.error("Transaction failed", { id: toastId });
          console.log(e);
        })
        .finally(() => {
          toast.dismiss(toastId);
          setSignLoading(false);
        });
      // setIsModalOpen(false);
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof CreatorPageAssetSchema>> = (
    data,
  ) => {
    setIsModalOpen(true);

    if (ipfs) {
      trxMutation.mutate({
        ipfs,
        code: getValues("code"),
        signWith: needSign(),
        limit: getValues("limit"),
      });
    } else {
      toast.error("Please upload a file");
    }
  };

  const loading =
    trxMutation.isLoading || isModalOpen || mutation.isLoading || signLoading;

  const uploadFile = async (fileToUpload: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload, fileToUpload.name);
      console.log("formData", fileToUpload);
      const res = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      const thumbnail = "https://ipfs.io/ipfs/" + ipfsHash;
      setCover(thumbnail);
      setValue("thumbnail", thumbnail);
      setCid(ipfsHash);

      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files) {
      if (files.length > 0) {
        const file = files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            toast.error("File size should be less than 1MB");
            return;
          }
          setFile(file);
          await uploadFile(file);
        }
      }
    }
  };
  return (
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
          className="input input-sm input-bordered  w-full"
          placeholder="You asset limit?"
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
        <input
          type="file"
          id="file"
          accept=".jpg, .png"
          onChange={handleChange}
        />
        {uploading && <progress className="progress w-56"></progress>}
        {coverUrl && (
          <>
            <Image
              className="p-2"
              width={120}
              height={120}
              alt="preview image"
              src={coverUrl}
            />
          </>
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
        disabled={loading}
      >
        {loading && <span className="loading loading-spinner"></span>}
        Create Page Asset
      </button>
    </form>
  );
}

export default NewPageAssetFrom;
