import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Avater from "../ui/avater";
import { error } from "console";
export default function About({ id }: { id: string }) {
  return (
    <div className="">
      <h2 className="text-2xl font-bold">About</h2>
      <div className="my-5 bg-base-200">
        <AboutForm id={id} />
      </div>
    </div>
  );
}

export const CreatorAboutShema = z.object({
  id: z.string(),
  description: z.string().optional(),
  name: z.string().min(3, { message: "Required" }),
});

function AboutForm({ id }: { id: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof CreatorAboutShema>>({
    resolver: zodResolver(CreatorAboutShema),
    defaultValues: { id: id },
  });

  const onSubmit: SubmitHandler<z.infer<typeof CreatorAboutShema>> = (data) =>
    console.log(data);
  // createPostMutation.mutate({ ...data, pubkey: props.id });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 p-5">
      <div className="flex gap-2">
        <div className="self-end">
          <Avater />
        </div>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Upload Photo</span>
          </div>
          <input
            type="file"
            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
          />
        </label>
      </div>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Display Name</span>
        </div>
        <input
          type="text"
          placeholder="Enter Name ..."
          {...register("name")}
          className="input input-bordered w-full max-w-xs"
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
          {...register("description")}
          className="textarea textarea-bordered h-24"
          placeholder="Description ..."
        ></textarea>
        {errors.description && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.description.message}
            </span>
          </div>
        )}
      </label>
      <button className="btn btn-primary" type="submit">
        {/* {createPostMutation.isLoading && ( */}
        {/* <span className="loading loading-spinner"></span> */}
        {/* )} */}
        Save
      </button>
    </form>
  );
}
