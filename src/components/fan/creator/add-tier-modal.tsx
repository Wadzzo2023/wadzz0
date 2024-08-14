import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import { Plus, PlusIcon } from "lucide-react";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Editor } from "~/components/editor";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { Button } from "~/components/shadcn/ui/button";

export const TierSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" })
    .refine(
      (value) => {
        // Check if the input is a single word
        return /^\w+$/.test(value);
      },
      {
        message: "Input must be a single word",
      },
    ),
  price: z
    .number({
      required_error: "Price must be entered as a number",
      invalid_type_error: "Price must be entered as a number",
    })
    .min(1, {
      message: "Price must be greater than 0",
    }),
  featureDescription: z
    .string()
    .min(20, { message: "Make description longer" }),
});

export default function AddTierModal({ creator }: { creator: Creator }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const mutation = api.fan.member.createMembership.useMutation({
    onSuccess: () => {
      toast.success("Tier created successfully");
      reset();
    },
  });
  const assetAmount = api.fan.trx.getAssetNumberforXlm.useQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm<z.infer<typeof TierSchema>>({
    resolver: zodResolver(TierSchema),
    defaultValues: {},
  });

  const onSubmit: SubmitHandler<z.infer<typeof TierSchema>> = (data) => {
    mutation.mutate(data);
  };

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  function handleEditorChange(value: string): void {
    setValue("featureDescription", value);

    // throw new Error("Function not implemented.");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <PlusIcon size={16} />
          Add Tier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[700px] overflow-y-auto">
        <h3 className="mb-4 text-center text-lg font-bold">
          Create a subscription tier!
        </h3>
        <div className="w-full">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col   gap-2 rounded-md bg-base-300 "
          >
            <label className="form-control w-full px-2">
              <div className="label">
                <span className="label-text">Tier Name</span>
              </div>
              <input
                type="text"
                placeholder="Name of the tier"
                {...register("name")}
                className="input input-bordered w-full  px-2"
              />
              {errors.name && (
                <div className="label">
                  <span className="label-text-alt text-warning">
                    {errors.name.message}
                  </span>
                </div>
              )}
            </label>

            <label className="form-control w-full px-2">
              <div className="label">
                <span className="label-text">Price</span>
              </div>
              <input
                {...register("price", { valueAsNumber: true })}
                className="input input-bordered w-full px-2 "
                type="number"
                step="1"
                min="1"
                placeholder={`Price in ${PLATFROM_ASSET.code}`}
              ></input>
              {errors.price && (
                <div className="label">
                  <span className="label-text-alt text-warning">
                    {errors.price.message}
                  </span>
                </div>
              )}
            </label>

            <label className="form-control  h-[200px] w-full px-2 ">
              <div className="label">
                <span className="label-text">Tier Features</span>
              </div>
              {/* <textarea
                  {...register("featureDescription")}
                  className="textarea textarea-bordered h-24"
                  placeholder="What does this tier offer?"
                /> */}

              <Editor
                height={"110px"}
                onChange={handleEditorChange}
                value={getValues("featureDescription")}
              />

              {errors.featureDescription && (
                <div className="label">
                  <span className="label-text-alt text-warning">
                    {errors.featureDescription.message}
                  </span>
                </div>
              )}
            </label>
            {/* <div className="max-w-xs">
                <Alert
                  type={mutation.error ? "warning" : "noraml"}
                  content={`To create a Tier, you'll need ${assetAmount.data} ${PLATFROM_ASSET.code} for your Asset account. Additionally, there's a platform fee of ${PLATFROM_FEE} ${PLATFROM_ASSET.code}. Total: ${assetAmount.data ?? 1 + Number(PLATFROM_FEE)}`}
                />
              </div> */}
          </form>
        </div>

        <DialogFooter className="flex w-full">
          <DialogClose asChild>
            <Button className="w-full" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button
            className="w-full"
            type="submit"
            disabled={mutation.isLoading}
          >
            {(mutation.isLoading || isModalOpen) && (
              <span className="loading loading-spinner"></span>
            )}
            Create Tier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
