import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";

export const AdminAssetFormSchema = z.object({
  logoUrl: z.string().url(),
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" }),
  issuer: z.string(),
  description: z.string(),
  link: z.string().url(),
  tags: z.string(),

  litemint: z.string().optional(),
  stellarx: z.string().optional(),
  stellarterm: z.string().optional(),
});

const MintedItemAdd: React.FC = () => {
  const [type, setType] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,

    formState: { errors },
  } = useForm<z.infer<typeof AdminAssetFormSchema>>({
    resolver: zodResolver(AdminAssetFormSchema),
  });

  const assetAdd = api.wallate.asset.addAsset.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Asset added");
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof AdminAssetFormSchema>> = (
    data,
  ) => {
    // toast.success("form ok");
    assetAdd.mutate(data);
  };

  console.log(errors, "err");

  return (
    <>
      <form
        className="container mt-2 space-y-2 rounded-box bg-base-300 p-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-lg font-bold">Add Wallate Asset</h2>
        <div className="form-control">
          <label htmlFor="logo">Logo Image Link</label>
          <input
            type="text"
            {...register("logoUrl")}
            id="logo"
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="assetCode">Asset Code</label>
          <input
            type="text"
            id="assetCode"
            {...register("code")}
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="issuerAddress">Issuer Address</label>
          <input
            type="text"
            id="issuerAddress"
            {...register("issuer")}
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            {...register("description")}
            required
            maxLength={180}
            className="textarea textarea-bordered"
          />
        </div>
        <div className="form-control">
          <label htmlFor="link">Link</label>
          <input
            type="text"
            id="link"
            {...register("link")}
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="tags">Tags [tags separate with , ]</label>
          <input
            type="text"
            {...register("tags")}
            id="tags"
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="litemintLink">Litemint (Optional)</label>
          <input
            type="text"
            id="litemintLink"
            {...register("litemint")}
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="stellarXLink">StellarX (Optional)</label>
          <input
            type="text"
            {...register("stellarx")}
            id="stellarXLink"
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="stellarTermLink">StellarTerm (Optional)</label>
          <input
            type="text"
            {...register("stellarterm")}
            id="stellarTermLink"
            className="input"
          />
        </div>
        <div className="space-x-2">
          {/* <select
            onChange={(e) => {
              setType(e.currentTarget.value);
            }}
            className="select "
            required
          >
            <option disabled selected>
              Type
            </option>
            <option>add</option>
            <option>update</option>
            <option>delete</option>
          </select> */}
          <button type="submit" className="btn btn-primary">
            {assetAdd.isLoading && <span className="loading" />}
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default MintedItemAdd;
