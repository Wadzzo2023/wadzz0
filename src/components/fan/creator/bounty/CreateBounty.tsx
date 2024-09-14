"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { MediaType } from "@prisma/client";
import clsx from "clsx";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Editor } from "~/components/editor";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import Alert from "~/components/ui/alert";
import useNeedSign from "~/lib/hook";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  TrxBaseFeeInPlatformAsset,
} from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

export const MediaInfo = z.object({
  url: z.string(),
  type: z.string().default(MediaType.IMAGE),
});

export const BountySchema = z.object({
  title: z.string().min(1, { message: "Title can't be empty" }),
  prizeInUSD: z
    .number()
    .min(0.00001, { message: "Prize can't less than 0.00001" }),
  prize: z.number().min(0.00001, { message: "Prize can't less than 0.00001" }),
  requiredBalance: z
    .number()
    .nonnegative({ message: "Required Balance can't be less than 0" })
    .optional(),

  content: z.string().min(2, { message: "Description can't be empty" }),
  medias: z.array(MediaInfo).optional(),
});

type MediaInfoType = z.TypeOf<typeof MediaInfo>;

const CreateBounty = () => {
  const [media, setMedia] = useState<MediaInfoType[]>([]);
  const [wantMediaType, setWantMedia] = useState<MediaType>();
  const [loading, setLoading] = useState(false);
  const { needSign } = useNeedSign();
  const session = useSession();
  const [prizeInAsset, setPrizeInAsset] = useState<number>(0);
  const { platformAssetBalance } = useUserStellarAcc();
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control modal
  const totalAmount =
    2 * Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);

  // console.log("platformAssetBalance", platformAssetBalance);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,

    formState: { errors, isValid },
  } = useForm<z.infer<typeof BountySchema>>({
    resolver: zodResolver(BountySchema),
    mode: "onChange",
    defaultValues: {},
  });

  const utils = api.useUtils();
  const CreateBountyMutation = api.bounty.Bounty.createBounty.useMutation({
    onSuccess: async (data) => {
      toast.success("Bounty Created");
      setIsDialogOpen(false);
      setPrizeInAsset(0);
      utils.bounty.Bounty.getAllBounties.refetch().catch((error) => {
        console.error("Error refetching bounties", error);
      });
    },
  });

  const SendBalanceToBountyMother =
    api.bounty.Bounty.sendBountyBalanceToMotherAcc.useMutation({
      onSuccess: async (data) => {
        if (data) {
          try {
            setLoading(true);
            const clientResponse = await clientsign({
              presignedxdr: data.xdr,
              walletType: session.data?.user?.walletType,
              pubkey: data.pubKey,
              test: clientSelect(),
            });
            if (clientResponse) {
              setLoading(true);
              CreateBountyMutation.mutate({
                title: getValues("title"),
                prizeInUSD: getValues("prizeInUSD"),
                prize: getValues("prize"),
                requiredBalance: getValues("requiredBalance") ?? 0,
                content: getValues("content"),
                medias: getValues("medias"),
              });
              setLoading(false);
              reset();
              setMedia([]);
            } else {
              setLoading(false);
              reset();
              toast.error("Error in signing transaction");
              setMedia([]);
            }
          } catch (error) {
            setLoading(false);
            console.error("Error sending balance to bounty mother", error);
            reset();
            toast.success("Bounty Created");
            setMedia([]);
          }
        }
      },
      onError: (error) => {
        console.error("Error creating bounty", error);
        toast.error(error.message);
        reset();
        setMedia([]);
        setLoading(false);
      },
    });
  const onSubmit: SubmitHandler<z.infer<typeof BountySchema>> = (data) => {
    console.log("data", data);
    data.medias = media;
    setLoading(true);
    SendBalanceToBountyMother.mutate({
      signWith: needSign(),
      prize: data.prize,
    });
    setLoading(false);
  };

  const addMediaItem = (url: string, type: MediaType) => {
    setMedia((prevMedia) => [...prevMedia, { url, type }]);
  };
  function handleEditorChange(value: string): void {
    setValue("content", value);
  }

  const RequiredBalance = 5000;
  const isCardDisabled = platformAssetBalance < RequiredBalance;
  const removeMediaItem = (index: number) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
  };

  const { data: prize } = api.bounty.Bounty.getCurrentUSDFromAsset.useQuery();
  console.log("prize", prize);
  return (
    <>
      {isCardDisabled ? (
        <Alert
          className="flex  items-center justify-center"
          type="error"
          content={`You don't have Sufficient Balance ,To create storage account, you need minimum ${RequiredBalance} ${PLATFORM_ASSET.code} `}
        />
      ) : (
        <div className="flex  w-full  justify-center">
          <Card
            className={clsx("w-full md:w-[650px]", {
              "blur-sm": isCardDisabled,
            })}
          >
            <CardHeader>
              <CardTitle className="text-center">
                Create a new Bounty{" "}
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-col gap-4 rounded-3xl bg-base-200 p-5"
              >
                <label className="form-control w-full ">
                  <input
                    readOnly={loading}
                    type="text"
                    placeholder="Add a Title..."
                    {...register("title")}
                    className="input input-bordered w-full "
                  />
                  {errors.title && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.title.message}
                      </span>
                    </div>
                  )}
                </label>
                <label className="h-[240px]">
                  {/* <textarea
                {...register("content")}
                className="textarea textarea-bordered h-48"
                placeholder="Add a Description..."
              ></textarea> */}
                  <Editor
                    height="200px"
                    value={getValues("content")}
                    onChange={handleEditorChange}
                    placeholder="Add a Description..."
                  />

                  {errors.content && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.content.message}
                      </span>
                    </div>
                  )}
                </label>
                <div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      {media.map((el, id) => (
                        <div key={id} className="relative">
                          <Image
                            src={el.url}
                            alt="media"
                            height={100}
                            width={100}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeMediaItem(id)}
                            className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className=" flex w-full flex-row  gap-2">
                      <label className=" mb-1 text-xs tracking-wide text-gray-600 sm:text-sm">
                        Prize in $USD
                        <input
                          step={0.00001}
                          readOnly={loading}
                          onChange={(e) => {
                            const value = e.target.value;
                            setValue("prizeInUSD", Number(value));
                            setValue("prize", Number(value) / Number(prize));
                            setPrizeInAsset(Number(value) / Number(prize));
                          }}
                          className="input input-bordered   w-full"
                          type="number"
                          placeholder=""
                        />
                        {errors.prizeInUSD && (
                          <div className="label">
                            <span className="label-text-alt text-warning">
                              {errors.prizeInUSD.message}
                            </span>
                          </div>
                        )}
                      </label>
                      <label className=" mb-1 text-xs tracking-wide text-gray-600 sm:text-sm">
                        Prize in {PLATFORM_ASSET.code}
                        <input
                          readOnly
                          type="number"
                          {...register("prize")}
                          className="input input-bordered   w-full"
                        />
                        {errors.prize && (
                          <div className="label">
                            <span className="label-text-alt text-warning">
                              {errors.prize.message}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>

                    <label className=" mb-1 w-full text-xs tracking-wide text-gray-600 sm:text-sm">
                      Required Balance to Join this Bounty in{" "}
                      {PLATFORM_ASSET.code}
                      <input
                        readOnly={loading}
                        type="number"
                        step={0.00001}
                        {...register("requiredBalance", {
                          valueAsNumber: true,
                        })}
                        className="input input-bordered   w-full"
                      />
                      {errors.requiredBalance && (
                        <div className="label">
                          <span className="label-text-alt text-warning">
                            {errors.requiredBalance.message}
                          </span>
                        </div>
                      )}
                    </label>
                    <UploadButton
                      disabled={media.length >= 4 || isCardDisabled || loading}
                      endpoint="imageUploader"
                      content={{
                        button: "Add Media",
                        allowedContent: "Max (4MB)",
                      }}
                      onClientUploadComplete={(res) => {
                        const data = res[0];

                        if (data?.url) {
                          addMediaItem(data.url, wantMediaType!);
                          setWantMedia(undefined);
                        }
                      }}
                      onUploadError={(error: Error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                    />
                  </div>
                </div>{" "}
                <CardFooter className="flex justify-between">
                  {platformAssetBalance < prizeInAsset + totalAmount ? (
                    <Alert
                      type="error"
                      content={`You don't have Sufficient Balance ,To  create this bounty, you need minimum ${prizeInAsset + totalAmount} ${PLATFORM_ASSET.code},`}
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Dialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            disabled={loading || !isValid}
                            className="w-full"
                          >
                            Create
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Confirmation </DialogTitle>
                          </DialogHeader>
                          <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
                            <div className="flow-root">
                              <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                                <dl className="flex items-center justify-between gap-4 py-3">
                                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                                    Prize
                                  </dt>
                                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                                    {prizeInAsset} {PLATFORM_ASSET.code}
                                  </dd>
                                </dl>

                                <dl className="flex items-center justify-between gap-4 py-3">
                                  <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                                    Fees
                                  </dt>
                                  <dd className="text-base font-medium text-green-500">
                                    5800 {PLATFORM_ASSET.code}
                                  </dd>
                                </dl>

                                <dl className="flex items-center justify-between gap-4 py-3">
                                  <dt className="text-base font-bold text-gray-900 dark:text-white">
                                    Total
                                  </dt>
                                  <dd className="text-base font-bold text-gray-900 dark:text-white">
                                    {prizeInAsset + 5800} {PLATFORM_ASSET.code}
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                          <DialogFooter className=" w-full">
                            <div className="flex w-full gap-4  ">
                              <DialogClose className="w-full">
                                <Button variant="outline" className="w-full">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button
                                disabled={loading || !isValid}
                                variant="destructive"
                                type="submit"
                                onClick={handleSubmit(onSubmit)}
                                className="w-full"
                              >
                                Confirm
                              </Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Alert
                        type="success"
                        content={`
                          Note: You will be charged ${prizeInAsset + 5800} ${PLATFORM_ASSET.code} to create this bounty
                          `}
                      />
                    </div>
                  )}
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
export default CreateBounty;
