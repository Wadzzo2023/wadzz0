import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Avater from "../../ui/avater";
import { Creator, User } from "@prisma/client";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

export default function About() {
  const user = api.fan.user.getUser.useQuery();
  if (user.data)
    return (
      <div className="flex  flex-col items-center ">
        {/* <h2 className="text-2xl font-bold">About</h2> */}
        <div className="my-5 w-96 rounded-box bg-base-200">
          <AboutForm user={user.data} />
        </div>
      </div>
    );
  else return <p className="text-error">no user</p>;
}

export const UserAboutShema = z.object({
  bio: z.string().max(100, { message: "max 100 charecter" }).nullable(),
  name: z
    .string()
    .min(3, { message: "Required" })
    .max(20, { message: "max 20 charecter" }),
  profileUrl: z.string().nullable().optional(),
});

function AboutForm({ user }: { user: User }) {
  const mutation = api.fan.user.updateUserProfile.useMutation();
  const updateProfileMutation =
    api.fan.user.changeUserProfilePicture.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof UserAboutShema>>({
    resolver: zodResolver(UserAboutShema),
    defaultValues: {
      name: user.name ?? "Unknown",
      bio: user.bio,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof UserAboutShema>> = (data) =>
    mutation.mutate(data);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2  p-5"
    >
      <div className="flex items-center  gap-2">
        <div className="">
          <Avater url={user.image} className="w-8" />
        </div>
        <UploadButton
          endpoint="imageUploader"
          appearance={{
            allowedContent(arg) {
              return { display: "none" };
            },
          }}
          content={{ button: "Change Photo" }}
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res);
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
      <label className="form-control w-full ">
        <div className="label">
          <span className="label-text">Display Name</span>
        </div>
        <input
          type="text"
          placeholder="Enter Name ..."
          {...register("name")}
          className="input input-bordered w-full "
        />
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
          <span className="label-text">Your bio</span>
        </div>
        <textarea
          {...register("bio")}
          className="textarea textarea-bordered h-28"
          placeholder="bio"
        ></textarea>
        {errors.bio && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.bio.message}
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
