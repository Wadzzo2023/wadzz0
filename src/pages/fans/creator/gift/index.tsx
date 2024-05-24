import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

import { DollarSign, Mail, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { submitSignedXDRToServer } from "package/connect_wallet";
import { fetchPubkeyfromEmail } from "~/utils/get-pubkey";
import Loading from "~/components/wallete/loading";
import { PLATFROM_ASSET } from "~/lib/stellar/fan/constant";
import Avater from "~/components/ui/avater";

export const FanGitFormSchema = z.object({
  pubkey: z.string().length(56),
  amount: z.string(),
});

export default function GiftPage() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof FanGitFormSchema>>({
    resolver: zodResolver(FanGitFormSchema),
  });

  const xdr = api.fan.trx.giftFollowerXDR.useMutation({
    onSuccess: (xdr) => {
      toast.promise(submitSignedXDRToServer(xdr), {
        loading: "Sending gift...",
        success: (d) => {
          if (d.successful) {
            reset();
            return "Gift sent successfully";
          } else return "Sorry, gift failed to send";
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

  const pubkey = watch("pubkey");

  async function fetchPubKey(): Promise<void> {
    try {
      const pub = await toast.promise(fetchPubkeyfromEmail(pubkey), {
        error: "Email don't have a pubkey",
        success: "Pubkey fetched successfully",
        loading: "Fetching pubkey...",
      });

      setValue("pubkey", pub, { shouldValidate: true });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className=" flex h-full flex-col items-center ">
      <div className="card w-full  max-w-xl bg-base-200 p-4">
        {/* <h2>Fan email / pubkey</h2> */}
        <h2 className="mb-4 text-2xl font-bold">Gift your fans</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="">
          <label className="form-control w-full py-2">
            <div className="label">
              <span className="label-text">Pubkey/Email</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                // onChange={(e) => setUserKey(e.target.value)}
                {...register("pubkey")}
                placeholder="Email/ Pubkey"
                className="input input-bordered w-full "
              />
              {z.string().email().safeParse(pubkey).success && (
                <div className="tooltip" data-tip="Fetch Pubkey">
                  <RefreshCcw onClick={fetchPubKey} />
                </div>
              )}
            </div>

            {pubkey && pubkey.length == 56 && (
              <div className="label">
                <span className="label-text">
                  <p className="text-sm">pubkey: {pubkey}</p>
                </span>
              </div>
            )}
          </label>

          <label className="input input-bordered flex  items-center gap-2">
            <DollarSign className="h-4 w-4 opacity-70" />
            <input
              type="number"
              {...register("amount")}
              className="grow"
              // className=" input input-bordered w-full "
            />
          </label>

          <button className="btn btn-secondary my-2" type="submit">
            {xdr.isLoading && <span className="loading loading-spinner" />}
            Gift
          </button>
          <CreatorPageBal />
        </form>
      </div>
      <div className="card mt-4  w-full max-w-xl bg-base-200 p-4">
        <h2 className="my-3 text-xl font-bold">Your Fans</h2>
        <FansList />
      </div>
    </div>
  );
}

function CreatorPageBal() {
  const bal = api.fan.creator.getCreatorPageAssetBalance.useQuery();

  if (bal.isLoading) return <div className="skeleton h-5 w-40" />;

  if (bal.data) {
    return (
      <p>
        {" "}
        You have {bal.data} {PLATFROM_ASSET.code}
      </p>
    );
  }

  if (bal.error) {
    return <p>{bal.error.message}</p>;
  }
}

function FansList() {
  const fans = api.fan.creator.getFansList.useQuery();

  if (fans.isLoading) return <Loading />;
  if (fans.data)
    return (
      <div>
        {fans.data.map((fan) => (
          <FanAvater key={fan.id} name={fan.user.name} pubkey={fan.user.id} />
        ))}
      </div>
    );
}

export function FanAvater({
  name,
  pubkey,
}: {
  name: string | null;
  pubkey: string;
}) {
  return (
    <div className="flex items-center gap-2  p-2 px-4 hover:rounded-lg hover:bg-base-100">
      <div>
        <Avater url={undefined} className="w-8" />
      </div>
      <div>
        {name}
        <p className="text-sm">{pubkey}</p>
      </div>
    </div>
  );
}
