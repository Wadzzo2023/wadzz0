import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";
import { CoverChange } from "./change-cover-button";
import PadSVG from "./profile/convert-svg";

export default function About({ creator }: { creator: Creator }) {
  return (


    <AboutForm creator={creator} />




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
    <div className="space-y-6 bg-base-200 p-6 rounded-lg shadow-md">

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full"
      >
        <div className="flex flex-col items-center   gap-2">
          <div className="space-y-4 ">
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
