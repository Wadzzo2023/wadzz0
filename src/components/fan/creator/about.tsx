import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Avater from "../../ui/avater";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import { CoverChange } from "./change-cover-button";
import toast from "react-hot-toast";

export default function About({ creator }: { creator: Creator }) {
  return (
    <div className="flex  flex-col items-center ">
      <h2 className="w-full rounded-full bg-base-200 text-center text-2xl font-bold">
        About
      </h2>
      <div className="my-5   w-96  rounded-box bg-base-200">
        <AboutForm creator={creator} />
      </div>
    </div>
  );
}

export const CreatorAboutShema = z.object({
  description: z
    .string()
    .max(100, { message: "Bio must be lass than 101 character" })
    .nullable(),
  name: z
    .string()
    .min(3, { message: "Name must be between 3 to 21 characters" })
    .max(20, { message: "Name must be between 3 to 21 characters" }),
  profileUrl: z.string().nullable().optional(),
});

function AboutForm({ creator }: { creator: Creator }) {
  const mutation = api.fan.creator.updateCreatorProfile.useMutation();
  const updateProfileMutation =
    api.fan.creator.changeCreatorProfilePicture.useMutation({
      onSuccess: () => {
        toast.success("Profile changes successfully");
      },
    });

  const updateSVg = api.fan.creator.changeCreatorBackgroundSVG.useMutation({
    onSuccess: () => {
      toast.success("SVG changes successfully");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof CreatorAboutShema>>({
    resolver: zodResolver(CreatorAboutShema),
    defaultValues: {
      name: creator.name,
      description: creator.bio,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof CreatorAboutShema>> = (data) =>
    mutation.mutate(data);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex  flex-col gap-2  p-5"
    >
      <div className="flex flex-col items-center  gap-2">
        <div className="text-center ">
          <span className="text-xs">Profile Dimension 200 x 200 pixels</span>
          <UploadButton
            className="w-full "
            endpoint="imageUploader"
            appearance={{
              button:
                "text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center ",
              container:
                "p-1 w-max flex-row rounded-md border-cyan-300 bg-slate-800",
              allowedContent:
                "flex h-8 flex-col items-center justify-center px-2 text-white",
            }}
            content={{ button: "Change Profile" }}
            onClientUploadComplete={(res) => {
              // Do something with the response
              // alert("Upload Completed");
              const data = res[0];

              if (data?.url) {
                updateProfileMutation.mutate(data.url);
              }
              // updateProfileMutation.mutate(res);
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>

        <CoverChange />
        <div className="text-center">
          <span className="text-xs">SVG Dimension 200 x 200 pixels</span>
          <UploadButton
            className="w-full "
            endpoint="imageUploader"
            appearance={{
              button:
                " text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center ",
              container:
                "p-1 w-max flex-row rounded-md border-cyan-300 bg-slate-800",
              allowedContent:
                "flex h-8 flex-col items-center justify-center px-2 text-white",
            }}
            content={{ button: "Change SVG" }}
            onClientUploadComplete={(res) => {
              // Do something with the response
              // alert("Upload Completed");
              const data = res[0];

              if (data?.url) {
                updateSVg.mutate(data.url);
              }
              // updateProfileMutation.mutate(res);
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
      </div>

      <label className="form-control w-full ">
        <div className="label">
          <span className="label-text font-bold uppercase">Display Name</span>
        </div>
        <input
          type="text"
          placeholder="Enter Name ..."
          {...register("name")}
          className="input input-bordered w-full "
        />
        <span className="text-xs">
          * Hint : Name must be between 3 to 21 characters
        </span>
        {errors.name && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.name.message}
            </span>
          </div>
        )}
      </label>
      <label className="form-control">
        <div className="label">
          <span className="label-text font-bold uppercase">Your bio</span>
        </div>
        <textarea
          {...register("description")}
          className="textarea textarea-bordered h-28"
          placeholder="Description ..."
        ></textarea>
        <span className="text-xs">
          * Hint : Bio can be up to 101 characters
        </span>
        {errors.description && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.description.message}
            </span>
          </div>
        )}
      </label>
      <button className="btn btn-primary" type="submit">
        {mutation.isLoading && (
          <span className="loading loading-spinner"></span>
        )}
        Save
      </button>
    </form>
  );
}
