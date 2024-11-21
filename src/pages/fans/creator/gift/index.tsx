import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

import { RefreshCcw } from "lucide-react";
import { submitSignedXDRToServer } from "package/connect_wallet";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import Avater from "~/components/ui/avater";
import Loading from "~/components/wallete/loading";
import { fetchPubkeyfromEmail } from "~/utils/get-pubkey";
import { addrShort } from "~/utils/utils";
export const FanGitFormSchema = z.object({
  pubkey: z.string().length(56),
  amount: z.string(),
});

export default function GiftPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof FanGitFormSchema>>({
    resolver: zodResolver(FanGitFormSchema),
  });

  const bal = api.fan.creator.getCreatorPageAssetBalance.useQuery();

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

  const handleFanAvatarClick = (pubkey: string) => {
    setValue("pubkey", pubkey, { shouldValidate: true });
  };

  if (bal.isLoading) return <Loading />;
  if (bal.data) {
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
            <div className="label">
              <span className="label-text">
                Amount of {bal.data.asset} to gift
              </span>
            </div>
            <label className="input input-bordered flex  items-center gap-2">
              <input
                type="number"
                placeholder={`Price in ${bal.data.asset}`}
                {...register("amount")}
                className="grow"
                // className=" input input-bordered w-full "
              />
            </label>
            <div className="flex flex-col gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="mt-2 w-full"
                    disabled={xdr.isLoading || !isValid}
                  >
                    Gift
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Confirmation </DialogTitle>
                  </DialogHeader>
                  <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">
                        Receiver Pubkey :{" "}
                        {getValues("pubkey")
                          ? addrShort(getValues("pubkey"))
                          : ""}
                      </p>
                      <p className="font-semibold">
                        Amount : {getValues("amount")} {bal.data.asset}
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="w-full">
                    <div className="flex w-full gap-4">
                      <DialogClose className="w-full">
                        <Button
                          disabled={xdr.isLoading}
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        disabled={xdr.isLoading || !isValid}
                        onClick={handleSubmit(onSubmit)}
                        variant="destructive"
                        type="submit"
                        className="w-full"
                      >
                        Confirm
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-2">
              <CreatorPageBal />
            </div>
          </form>
        </div>
        <div className="card mt-4  w-full max-w-xl bg-base-200 p-4">
          <h2 className="my-3 text-xl font-bold">Your Fans</h2>
          <FansList handleFanAvatarClick={handleFanAvatarClick} />
        </div>
      </div>
    );
  } else if (bal.data === undefined) {
    return <div>You don't have page asset to gift.</div>;
  }
}

function CreatorPageBal() {
  const bal = api.fan.creator.getCreatorPageAssetBalance.useQuery();

  if (bal.isLoading) return <div className="skeleton h-5 w-40" />;

  if (bal.data) {
    return (
      <p>
        You have {bal.data.balance} {bal.data.asset}
      </p>
    );
  }

  if (bal.error) {
    return <p>{bal.error.message}</p>;
  }
}

function FansList({
  handleFanAvatarClick,
}: {
  handleFanAvatarClick: (pubkey: string) => void;
}) {
  const fans = api.fan.creator.getFansList.useQuery();

  if (fans.isLoading) return <Loading />;
  if (fans.data)
    return (
      <div>
        {fans.data.map((fan) => (
          <FanAvater
            handleFanAvatarClick={handleFanAvatarClick}
            key={fan.id}
            name={fan.user.name}
            pubkey={fan.user.id}
            url={fan.user.image}
          />
        ))}
      </div>
    );
}

export function FanAvater({
  name,
  pubkey,
  handleFanAvatarClick,
  url,
}: {
  name: string | null;
  pubkey: string;
  handleFanAvatarClick: (pubkey: string) => void;
  url: string | null;
}) {
  return (
    <div
      className="flex items-center gap-2  p-2 px-4 hover:rounded-lg hover:bg-base-100"
      onClick={() => handleFanAvatarClick(pubkey)}
    >
      <div>
        <Avater url={url ?? undefined} className="w-8" />
      </div>
      <div>
        {name}
        <p className="text-sm">{pubkey}</p>
      </div>
    </div>
  );
}
