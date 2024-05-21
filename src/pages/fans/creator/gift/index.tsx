import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

import { DollarSign, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { submitSignedXDRToServer } from "package/connect_wallet";

export const FanGitFormSchema = z.object({
  pubkey: z.string().length(56).or(z.string().email()),
  amount: z.string(),
});

export default function GiftPage() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof FanGitFormSchema>>({
    resolver: zodResolver(FanGitFormSchema),
  });

  const xdr = api.fan.trx.giftFollowerXDR.useMutation({
    onSuccess: (xdr) => {
      toast.promise(submitSignedXDRToServer(xdr), {
        loading: "Sending gift...",
        success: (d) => {
          if (d.successful) return "Gift sent successfully";
          else return "Sorry, gift failed to send";
        },
        error: (e) => {
          return "Sorry, Some error in Stellar network. Please try again later.";
          console.error(e);
        },
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit: SubmitHandler<z.infer<typeof FanGitFormSchema>> = (data) => {
    xdr.mutate(data);
  };

  return (
    <div>
      Fan email / pubkey
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="input input-bordered flex max-w-xs items-center gap-2">
          <Mail className="h-4 w-4 opacity-70" />
          <input
            type="text"
            {...register("pubkey")}
            className="grow"
            // className=" input input-bordered w-full "
          />
        </label>
        {errors.pubkey && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.pubkey.message}
            </span>
          </div>
        )}

        <label className="input input-bordered flex max-w-xs items-center gap-2">
          <DollarSign className="h-4 w-4 opacity-70" />
          <input
            type="number"
            {...register("amount")}
            className="grow"
            // className=" input input-bordered w-full "
          />
        </label>

        <button className="btn" type="submit">
          {xdr.isLoading && <span className="loading loading-spinner" />}
          Add
        </button>
      </form>
    </div>
  );
}
