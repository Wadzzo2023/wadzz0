import { zodResolver } from "@hookform/resolvers/zod";
import React, { useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { AccountSchema } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

export const AdminAssetFormSchema = z.object({
  logoUrl: z.string().url(),
  code: z
    .string()
    .min(4, { message: "Minimum 4 char" })
    .max(12, { message: "Maximum 12 char" }),
  issuer: AccountSchema.optional(),
  description: z.string(),
  link: z.string().url(),
  tags: z
    .string()
    .trim()
    .transform((v) =>
      Array.from(new Set(v.split(",").map((x) => x.trim().toLowerCase()))),
    ),

  litemint: z.string(),
  stellarx: z.string(),
  stellarterm: z.string(),
});

const Form: React.FC = () => {
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

  const assetAdd = api.wallate.asset.addAsset.useMutation();

  // const handleFindSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const fromData = new FormData(e.currentTarget);

  //   try {
  //     setFindLoading(true);

  //     const { data }: AxiosResponse<AssetType> = await toast.promise(
  //       axios.get("/api/get-asset", {
  //         params: Object.fromEntries(fromData),
  //       }),
  //       {
  //         loading: "Getting asset data...",
  //         error: (e: {
  //           response: {
  //             data: {
  //               error: string;
  //             };
  //           };
  //         }) => {
  //           return e.response.data.error;
  //         },
  //         success: "Found asset",
  //       },
  //     );

  //     // refs.tags.current!.value = data.tags.join(",");
  //     // get all the comma seperated tag

  //     // seems market is selected

  //     // for (const market of data.availableMarket) {
  //     //   switch (market.title.toLowerCase()) {
  //     //     case "litemint":
  //     //       refs.litemint.current!.value = market.link;
  //     //       break;
  //     //     case "stellarx":
  //     //       refs.stellarx.current!.value = market.link;
  //     //       break;
  //     //     case "stellarterm":
  //     //       refs.stellarterm.current!.value = market.link;
  //     //       break;
  //     //     default:
  //     //       break;
  //     //   }
  //     // }
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     setFindLoading(false);
  //   }
  // };

  // const handleSubmit2 = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const fromData = new FormData(e.currentTarget);
  //   if (!type) {
  //     toast.error("Select a type");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     await toast.promise(
  //       axios.post("/api/add-asset", {
  //         type,
  //         data: Object.fromEntries(fromData),
  //       }),
  //       {
  //         loading: `${type}ing...`,
  //         error: (e: {
  //           response: {
  //             data: {
  //               error: string;
  //             };
  //           };
  //         }) => {
  //           return e.response.data.error;
  //         },
  //         success: "Success",
  //       },
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onSubmit: SubmitHandler<z.infer<typeof AdminAssetFormSchema>> = (
    data,
  ) => {
    assetAdd.mutate(data);
  };

  return (
    <>
      <div className="container mt-2 h-full rounded-box bg-base-300 p-4">
        <span className="text-xl font-bold">Find asset</span>
        <form
          onSubmit={handleSubmit(onSubmit)}
          // onSubmit={(e) => void handleFindSubmit(e)}
          className="flex flex-col items-end gap-2 md:flex-row"
        >
          <div className="form-control w-full">
            <label htmlFor="assetCode">Asset Code</label>
            <input
              type="text"
              id="assetCode"
              name="code"
              required
              className="input "
            />
          </div>
          <div className="form-control w-full">
            <label htmlFor="issuerAddress">Issuer Address</label>
            <input
              type="text"
              id="issuerAddress"
              name="issuer"
              required
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {findLoading && <span className="loading" />}
            Find
          </button>
        </form>
      </div>
      <form
        onSubmit={(e) => void handleSubmit2(e)}
        className="container mt-2 space-y-2 rounded-box bg-base-300 p-4"
      >
        <div className="form-control">
          <label htmlFor="logo">Logo Image Link</label>
          <input
            type="text"
            id="logo"
            name="logoUrl"
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="assetCode">Asset Code</label>
          <input
            type="text"
            id="assetCode"
            name="code"
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="issuerAddress">Issuer Address</label>
          <input
            type="text"
            id="issuerAddress"
            name="issuer"
            required
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={180}
            className="textarea textarea-bordered"
          />
        </div>
        <div className="form-control">
          <label htmlFor="link">Link</label>
          <input type="text" id="link" name="link" required className="input" />
        </div>
        <div className="form-control">
          <label htmlFor="tags">Tags [tags separate with , ]</label>
          <input type="text" id="tags" name="tags" required className="input" />
        </div>
        <div className="form-control">
          <label htmlFor="litemintLink">Litemint (Optional)</label>
          <input
            type="text"
            id="litemintLink"
            name="litemint"
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="stellarXLink">StellarX (Optional)</label>
          <input
            type="text"
            id="stellarXLink"
            name="stellarx"
            className="input"
          />
        </div>
        <div className="form-control">
          <label htmlFor="stellarTermLink">StellarTerm (Optional)</label>
          <input
            type="text"
            id="stellarTermLink"
            name="stellarterm"
            className="input"
          />
        </div>
        <div className="space-x-2">
          <select
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
          </select>
          <button type="submit" className="btn btn-primary">
            {assetAdd.isLoading && <span className="loading" />}
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default Form;
