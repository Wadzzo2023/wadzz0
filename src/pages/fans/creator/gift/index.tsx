import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";
import { RefreshCcw } from "lucide-react";
import { clientsign, submitSignedXDRToServer } from "package/connect_wallet";
import { useEffect, useState } from "react";
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
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET, TrxBaseFee, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant";
import useNeedSign from "~/lib/hook";
import { useSession } from "next-auth/react";
import { clientSelect } from "~/lib/stellar/fan/utils";

enum assetType {
  PAGEASSET = "PAGEASSET",
  PLATFORMASSET = "PLATFORMASSET",
  SHOPASSET = "SHOPASSET"
}


export const FanGitFormSchema = z.object({
  pubkey: z.string().length(56),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
    message: "Amount must be a number",
  }).int().positive(),
});


type selectedAssetType = {
  assetCode: string;
  assetIssuer: string;
  balance: number;
  assetType: assetType;
}

export default function GiftPage() {
  const session = useSession()
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<selectedAssetType | null>(null);
  const [remainingToken, setRemainingToken] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const { needSign } = useNeedSign();
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
    defaultValues: {
      amount: 1
    }
  });

  const pageAssetbal = api.fan.creator.getCreatorPageAssetBalance.useQuery();
  const shopAssetbal = api.fan.creator.getCreatorShopAssetBalance.useQuery();
  const { data: extraCost } = api.bounty.Bounty.getplatformAssetNumberForXLM.useQuery(
    {
      xlm: 1
    }
  )
  let cost = 0;

  const { platformAssetBalance } = useUserStellarAcc();
  const xdr = api.fan.trx.giftFollowerXDR.useMutation({
    onSuccess: async (xdr) => {
      if (xdr) {

        try {
          const clientResponse = await clientsign({
            presignedxdr: xdr,
            walletType: session.data?.user?.walletType,
            pubkey: session.data?.user.id,
            test: clientSelect(),
          });

          if (clientResponse) {
            toast.success("Transaction successful");

          } else {
            toast.error("Transaction failed");
            setIsDialogOpen(false);
          }
        } catch (signError) {
          if (signError instanceof Error) {
            toast.error(`Error: ${signError.message}`);
          } else {
            toast.error("Something went wrong.");
          }
        } finally {
          setIsDialogOpen(false);

        }
      }
    },
    onError: (e) => {
      setIsDialogOpen(false);
      toast.error(e.message)
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof FanGitFormSchema>> = (data) => {
    if (!selectedAsset) {
      return;
    }

    xdr.mutate({
      amount: data.amount,
      assetCode: selectedAsset.assetCode,
      assetIssuer: selectedAsset.assetIssuer,
      assetType: selectedAsset.assetType,
      pubkey: data.pubkey,
      signWith: needSign(),

    });
  };
  if (extraCost) {
    cost = Number(TrxBaseFee) + Number(TrxBaseFeeInPlatformAsset) + extraCost;
  }
  const pubkey = watch("pubkey");
  const maxTokens = watch("amount");
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

  useEffect(() => {
    if (selectedAsset?.balance) {
      setRemainingToken(selectedAsset.balance - Number(maxTokens));
    }
  }, [maxTokens, selectedAsset]);

  if (pageAssetbal.isLoading) return <Loading />;
  if (pageAssetbal.data) {
    return (
      <div className=" flex h-full flex-col items-center mt-8 ">
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
            <div className="w-full">
              <Select
                onValueChange={(value) => {
                  const parts = value.split(" ");
                  if (parts.length === 4) {
                    setSelectedAsset({
                      assetCode: parts[0] ?? "",  // Ensure it's always a string
                      assetIssuer: parts[1] ?? "",
                      balance: parseFloat(parts[2] ?? "0"), // Ensure balance is a number
                      assetType: (parts[3] as assetType) ?? "defaultAssetType", // Handle undefined case
                    });
                  } else {
                    setSelectedAsset(null);
                  }
                }}
              >
                <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectGroup>
                    <SelectLabel className="text-center">PAGE ASSET</SelectLabel>
                    <SelectItem
                      value={
                        pageAssetbal.data.assetCode + " " + pageAssetbal.data.assetCode + " " + pageAssetbal.data.balance + " " + "PAGEASSET"
                      }
                      onClick={() => setSelectedAsset({
                        assetCode: pageAssetbal.data.assetCode,
                        assetIssuer: pageAssetbal.data.assetIssuer,
                        balance: pageAssetbal.data.balance,
                        assetType: "PAGEASSET" as assetType

                      })}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{pageAssetbal.data.assetCode}  </span>
                        <span> ({pageAssetbal.data.balance})</span>
                      </div>
                    </SelectItem>
                    <SelectLabel className="text-center">PLATFORM ASSET</SelectLabel>
                    <SelectItem
                      value={
                        PLATFORM_ASSET.code + " " + PLATFORM_ASSET.issuer + " " + platformAssetBalance + " " + "PLATFORMASSET"
                      }
                      onClick={() => setSelectedAsset({
                        assetCode: PLATFORM_ASSET.code,
                        assetIssuer: PLATFORM_ASSET.issuer,
                        balance: platformAssetBalance,
                        assetType: "PLATFORMASSET" as assetType
                      })}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{PLATFORM_ASSET.code}  </span>
                        <span> ({platformAssetBalance})</span>
                      </div>
                    </SelectItem>
                    <SelectLabel className="text-center">SHOP ASSET</SelectLabel>
                    {
                      !shopAssetbal.data || shopAssetbal.data.length < 2 ? <div
                        className="flex items-center justify-between w-full"
                      >
                        <span>No Shop Asset Availabe!</span>
                      </div> :
                        shopAssetbal.data.map((asset) => (
                          asset.asset_type === "credit_alphanum4" || asset.asset_type === "credit_alphanum12"
                            && (asset.asset_code !== pageAssetbal.data.assetCode && asset.asset_issuer !== pageAssetbal.data.assetIssuer)
                            ? (
                              <SelectItem
                                key={asset.asset_code}
                                value={asset.asset_code + " " + asset.asset_issuer + " " + asset.balance + " " + "SHOPASSET"}
                                onClick={() => setSelectedAsset({
                                  assetCode: asset.asset_code,
                                  assetIssuer: asset.asset_issuer,
                                  balance: Number(asset.balance),
                                  assetType: "SHOPASSET" as assetType
                                })}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{asset.asset_code}  </span>
                                  <span> ({asset.balance})</span>
                                </div>
                              </SelectItem>
                            ) : <></>
                        ))
                    }

                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {
              selectedAsset ? (
                <>
                  <div className="label">
                    <span className="label-text">
                      Amount of {selectedAsset.assetCode} to gift
                    </span>
                  </div>
                  <label className="input input-bordered flex  items-center gap-2">
                    <input
                      type="number"
                      placeholder={`Price in ${selectedAsset.assetCode}`}
                      {...register("amount", {
                        valueAsNumber: true,
                        min: 1
                      })}
                      className="grow"
                    />
                  </label>
                </>
              ) : <></>
            }
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
                        Amount : {getValues("amount")} {selectedAsset?.assetCode}
                      </p>
                      {/* // showing cost  */}
                      <p className="font-semibold">
                        Cost : {cost} {PLATFORM_ASSET.code}
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
              {
                selectedAsset ? (
                  <p className="text-sm"> Remaining Balance: {remainingToken > 0 ? remainingToken : 0}</p>
                ) : (
                  <p className="text-sm">Please select asset to gift</p>
                )
              }
            </div>
          </form>
        </div>
        <div className="card mt-4  w-full max-w-xl bg-base-200 p-4">
          <h2 className="my-3 text-xl font-bold">Your Fans</h2>
          <FansList handleFanAvatarClick={handleFanAvatarClick} />
        </div>
      </div>
    );
  } else if (pageAssetbal.data === undefined) {
    return <div className="h-full flex items-center justify-center">
      <div className="h-full flex items-center justify-center">
        You don&apos;t have page asset to gift.
      </div>
    </div>;
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
