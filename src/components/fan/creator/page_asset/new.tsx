import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "~/components/shadcn/ui/button";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { PLATFORM_ASSET, PLATFORM_FEE } from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";

export const CreatorPageAssetSchema = z.object({
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" })
    .refine(
      (value) => {
        // Check if the input is a single word
        return /^\w+$/.test(value);
      },
      {
        message: "Input must be a single word",
      },
    ),
  limit: z
    .number({
      required_error: "Limit must be entered as a number",
      invalid_type_error: "Limit must be entered as a number",
    })
    .min(1, { message: "Limit must be greater than 0" })
    .nonnegative(),
  thumbnail: z.string(),
});

function NewPageAssetFrom({ requiredToken }: { requiredToken: number }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [signLoading, setSignLoading] = React.useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCover] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);

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
      setIsOpen(false);
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
            console.log(getValues("thumbnail"));
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

  const onSubmit = () => {
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
      // console.log("formData", fileToUpload);
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
      className="mb-2 mt-2 flex flex-col items-center  gap-2 rounded-md bg-base-300 p-2"
    >
      <label className="form-control w-full px-2">
        <div className="label">
          <span className="label-text">Page Asset Name</span>
        </div>
        <input
          type="text"
          placeholder="Enter Page Asset Code"
          {...register("code")}
          className="input input-bordered w-full "
        />
        {errors.code && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.code.message}
            </span>
          </div>
        )}
      </label>

      <label className="form-control w-full px-2">
        <div className="label">
          <span className="label-text">Limit</span>
        </div>
        <input
          type="number"
          {...register("limit", { valueAsNumber: true })}
          min={1}
          step={1}
          className="input input-bordered w-full"
          placeholder="Asset Limit"
        />
        {errors.limit && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.limit.message}
            </span>
          </div>
        )}
      </label>

      <label className="form-control w-full px-2">
        <input
          type="file"
          id="file"
          accept=".jpg, .png"
          onChange={handleChange}
        />
        {uploading && (
          <progress className="progress mt-2 w-full px-2"></progress>
        )}
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

      <div className="px-2 text-sm">
        <Alert
          className=""
          type={mutation.error ? "warning" : "normal"}
          content={`To create this page token, you'll need ${requiredToken} ${PLATFORM_ASSET.code} for your Asset account`}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" disabled={loading}>
            Create Page Asset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div>
            Your account will be charged {requiredToken}{" "}
            <span className="text-red-600">{PLATFORM_ASSET.code}</span> to
            create this page token;
          </div>
          <DialogFooter className=" w-full">
            <div className="flex w-full gap-4  ">
              <DialogClose className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                type="submit"
                onClick={() => onSubmit()}
                disabled={loading}
                className="w-full"
              >
                {loading && <span className="loading loading-spinner" />}
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export default NewPageAssetFrom;
