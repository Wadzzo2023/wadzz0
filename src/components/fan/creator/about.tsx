import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";
import { CoverChange } from "./change-cover-button";
import PadSVG from "./profile/convert-svg";
import { UploadS3Button } from "~/pages/test";

export const CreatorAboutShema = z.object({
  description: z
    .string()
    .max(100, { message: "Bio must be lass than 101 character" })
    .nullable(),
  name: z
    .string()
    .min(3, { message: "Name must be between 3 to 98 characters" })
    .max(98, { message: "Name must be between 3 to 98 characters" }),
  profileUrl: z.string().nullable().optional(),
});

export default function About({ creator }: { creator: Creator }) {


  const mutation = api.fan.creator.updateCreatorProfile.useMutation({
    onSuccess: () => {
      toast.success("Information updated successfully");
    },
  });
  const updateProfileMutation =
    api.fan.creator.changeCreatorProfilePicture.useMutation({
      onSuccess: () => {
        toast.success("Profile Picture changes successfully");
      },
    });
  const coverChangeMutation =
    api.fan.creator.changeCreatorCoverPicture.useMutation({
      onSuccess: () => {
        toast.success("Cover Changed Successfully");
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
    <div className="space-y-6 bg-base-200 p-6 rounded-lg shadow-md w-full">

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full"
      >
        <div className="flex flex-col items-center w-full   gap-2">
          <div className="space-y-4  w-1/2 text-center">
            <span className="text-xs">Profile Dimension 200 x 200 pixels</span>
            <UploadS3Button
              endpoint="profileUploader"
              onClientUploadComplete={(res) => {
                const fileUrl = res.url;
                updateProfileMutation.mutate(fileUrl);
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                toast.error(`ERROR! ${error.message}`);

              }}
              type="profile"
            />

          </div>

          <div className="space-y-4  w-1/2 text-center">
            <span className="text-xs">Cover Dimension of 851 x 315 pixels</span>
            <UploadS3Button
              endpoint="coverUploader"
              onClientUploadComplete={(res) => {
                const fileUrl = res.url;
                coverChangeMutation.mutate(fileUrl);
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                toast.error(`ERROR! ${error.message}`);

              }}
              type="cover"
            />

          </div>
          <PadSVG />
        </div>

        <label className="w-full ">
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
            * Hint : Name must be between 3 to 98 characters
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
        <button className="btn btn-primary w-full" type="submit">
          {mutation.isLoading && (
            <span className="loading loading-spinner"></span>
          )}
          Save
        </button>
      </form>
    </div>
  );





}


