import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const FanPubkeySchema = z.object({
  pubkey: z.string().length(56).or(z.string().email()),
});

export default function GiftPage() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof FanPubkeySchema>>({
    resolver: zodResolver(FanPubkeySchema),
  });

  const addAdmin = api.wallate.admin.makeAdmin.useMutation();

  const onSubmit: SubmitHandler<z.infer<typeof FanPubkeySchema>> = (data) => {
    addAdmin.mutate(data.pubkey);
  };

  return (
    <div>
      Fan email / pubkey
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
