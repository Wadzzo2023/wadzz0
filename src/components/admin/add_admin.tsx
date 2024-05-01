import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const AdminAddSchema = z.object({
  pubkey: z.string().length(56),
});

export default function AddAdmin() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof AdminAddSchema>>({
    resolver: zodResolver(AdminAddSchema),
  });

  const addAdmin = api.wallate.admin.makeAdmin.useMutation();

  const onSubmit: SubmitHandler<z.infer<typeof AdminAddSchema>> = (data) => {
    addAdmin.mutate(data.pubkey);
  };

  return (
    <div>
      AddAdmin
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          {...register("pubkey")}
          className="input input-bordered w-full max-w-xs"
        />
        {errors.pubkey && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.pubkey.message}
            </span>
          </div>
        )}
        <button className="btn" type="submit">
          {addAdmin.isLoading && <span className="loading loading-spinner" />}
          Add
        </button>
      </form>
    </div>
  );
}
