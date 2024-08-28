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
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { UploadButton } from "~/utils/uploadthing";
import clsx from "clsx";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import Alert from "~/components/ui/alert";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";

export const MediaInfo = z.object({
  url: z.string(),
  type: z.string().default(MediaType.IMAGE),
});

export const BountySchema = z.object({
  title: z.string().min(1, { message: "Title can't be empty" }),
  priceInUSD: z.number().min(1, { message: "Price can't less than 0" }),
  priceInBAND: z.number().min(1, { message: "Price can't less than 0" }),
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

  const createBountyMutation = api.bounty.Bounty.createBounty.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Bounty Created");
      setMedia([]);
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof BountySchema>> = (data) => {
    data.medias = media;
    createBountyMutation.mutate({
      title: data.title,
      content: data.content,
      priceInUSD: data.priceInUSD,
      priceInBAND: data.priceInBAND,
      requiredBalance: data.requiredBalance,
      medias: data.medias,
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
              <CardTitle>Create a new Bounty </CardTitle>
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
                  <div className="flex  flex-col items-center gap-2">
                    <div className="flex gap-2">
                      {media.map((el, id) => (
                        <Image
                          key={id}
                          src={el.url}
                          alt="d"
                          height={100}
                          width={100}
                        />
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder={`Required Balance to Join Bounty in  ${PLATFROM_ASSET.code}`}
                      {...register("requiredBalance", { valueAsNumber: true })}
                      className="input input-bordered   w-full"
                    />
                    {errors.priceInBAND && (
                      <div className="label">
                        <span className="label-text-alt text-warning">
                          {errors.priceInBAND.message}
                        </span>
                      </div>
                    )}
                    <div className=" flex w-full flex-row gap-2">
                      <input
                        type="number"
                        placeholder="Price in USD $"
                        {...register("priceInUSD", { valueAsNumber: true })}
                        className="input input-bordered w-full "
                      />
                      {errors.priceInUSD && (
                        <div className="label">
                          <span className="label-text-alt text-warning">
                            {errors.priceInUSD.message}
                          </span>
                        </div>
                      )}
                      <input
                        type="number"
                        placeholder="Price in BAND"
                        {...register("priceInBAND", { valueAsNumber: true })}
                        className="input input-bordered   w-full"
                      />
                      {errors.priceInBAND && (
                        <div className="label">
                          <span className="label-text-alt text-warning">
                            {errors.priceInBAND.message}
                          </span>
                        </div>
                      )}
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
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => reset()}
                  >
                    Cancel
                  </Button>

                  <Button type="submit">Create</Button>
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
