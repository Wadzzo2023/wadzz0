"use client";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "~/components/editor";
import { MediaType } from "@prisma/client";
import { Image as ImageIcon, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { UploadButton } from "~/utils/uploadthing";
import clsx from "clsx";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import Alert from "~/components/ui/alert";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { getPlatfromAssetPrice } from "~/lib/stellar/fan/get_token_price";
import useNeedSign from "~/lib/hook";
import { clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { clientSelect } from "~/lib/stellar/fan/utils";

export const MediaInfo = z.object({
  url: z.string(),
  type: z.string().default(MediaType.IMAGE),
});

export const BountySchema = z.object({
  title: z.string().min(1, { message: "Title can't be empty" }),
  priceInUSD: z.number().min(1, { message: "Price can't less than 0" }),
  price: z.number().min(1, { message: "Price can't less than 0" }),
  requiredBalance: z
    .number()
    .min(1, { message: "Required Balance can't be less that 0" }),
  content: z.string().min(2, { message: "Description can't be empty" }),
  medias: z.array(MediaInfo).optional(),
});

type MediaInfoType = z.TypeOf<typeof MediaInfo>;

const CreateBounty = () => {
  const [media, setMedia] = useState<MediaInfoType[]>([]);
  const [wantMediaType, setWantMedia] = useState<MediaType>();
  const { needSign } = useNeedSign();
  const session = useSession();
  const { platformAssetBalance } = useUserStellarAcc();
  console.log(platformAssetBalance);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,

    formState: { errors },
  } = useForm<z.infer<typeof BountySchema>>({
    resolver: zodResolver(BountySchema),
  });

  const CreateBountyMutation = api.bounty.Bounty.createBounty.useMutation({
    onSuccess: async (data) => {
      toast.success("Bounty Created");
    },
  });

  const SendBalanceToBountyMother =
    api.bounty.Bounty.sendBountyBalanceToMotherAcc.useMutation({
      onSuccess: async (data) => {
        if (data) {
          try {
            const clientResponse = await clientsign({
              presignedxdr: data.xdr,
              walletType: session.data?.user?.walletType,
              pubkey: data.pubKey,
              test: clientSelect(),
            });
            if (clientResponse) {
              CreateBountyMutation.mutate({
                title: getValues("title"),
                priceInUSD: getValues("priceInUSD"),
                price: getValues("price"),
                requiredBalance: getValues("requiredBalance"),
                content: getValues("content"),
                medias: getValues("medias"),
              });
              reset();
              toast.success("Bounty Created");
              setMedia([]);
            }
          } catch (error) {
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
      },
    });
  const onSubmit: SubmitHandler<z.infer<typeof BountySchema>> = (data) => {
    data.medias = media;
    SendBalanceToBountyMother.mutate({
      signWith: needSign(),
      price: data.price,
    });
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

  const [price, setPrice] = useState<number>(0);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await getPlatfromAssetPrice();
      console.log(res);
      setPrice(res);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }, []);

  useEffect(() => {
    fetchPrice().catch((error) => {
      console.error("Error fetching price:", error);
    });
  }, [fetchPrice]);

  console.log(price);
  return (
    <>
      {isCardDisabled ? (
        <Alert
          className="flex  items-center justify-center"
          type="error"
          content={`You don't have Sufficient Balance ,To create storage account, you need minimum ${RequiredBalance} ${PLATFROM_ASSET.code} `}
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
                    <label className=" mb-1 w-full text-xs tracking-wide text-gray-600 sm:text-sm">
                      Required Balance to Join this Bounty in{" "}
                      {PLATFROM_ASSET.code}
                      <input
                        type="number"
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
                    <div className=" flex w-full flex-row  gap-2">
                      <label className=" mb-1 text-xs tracking-wide text-gray-600 sm:text-sm">
                        Price in $USD
                        <input
                          onChange={(e) => {
                            const value = e.target.value;
                            setValue("priceInUSD", Number(value));
                            setValue("price", Number(value) / Number(price));
                          }}
                          className="input input-bordered   w-full"
                          type="number"
                          placeholder=""
                        />
                        {errors.priceInUSD && (
                          <div className="label">
                            <span className="label-text-alt text-warning">
                              {errors.priceInUSD.message}
                            </span>
                          </div>
                        )}
                      </label>
                      <label className=" mb-1 text-xs tracking-wide text-gray-600 sm:text-sm">
                        Price in {PLATFROM_ASSET.code}
                        <input
                          readOnly
                          type="number"
                          {...register("price", { valueAsNumber: true })}
                          className="input input-bordered   w-full"
                        />
                        {errors.price && (
                          <div className="label">
                            <span className="label-text-alt text-warning">
                              {errors.price.message}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    <UploadButton
                      disabled={media.length >= 4 || isCardDisabled}
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
                  <Button className="w-full" type="submit">
                    Create
                  </Button>
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
