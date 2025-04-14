import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import { Plus, PlusIcon } from "lucide-react";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Editor } from "~/components/editor";
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
import { BADWORDS } from "~/utils/banned-word";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

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
    )
    .refine(
      (value) => {
        return !BADWORDS.some((word) => value.includes(word));
      },
      {
        message: "Input contains banned words.",
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
    .min(10, { message: "Make description longer" }),
});

export default function AddTierModal({ creator }: { creator: Creator }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const mutation = api.fan.member.createMembership.useMutation({
    onSuccess: () => {
      toast.success("Tier created successfully");
      setIsOpen(false);
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

  function handleEditorChange(value: string): void {
    setValue("featureDescription", value);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <PlusIcon size={16} />
          Add Tier
        </Button>
      </DialogTrigger>
      <DialogContent className="p-2">
        <h3 className="mb-4 text-center text-lg font-bold">
          Create a subscription tier!
        </h3>
        <div className="w-full  ">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col   gap-2  "
          >
            <div className="rounded-md bg-base-300 h-full">
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
                  <span className="label-text">
                    Requirement of your page asset
                  </span>
                </div>
                <input
                  {...register("price", { valueAsNumber: true })}
                  className="input input-bordered w-full px-2 "
                  type="number"
                  step="1"
                  min="1"
                ></input>
                {errors.price && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.price.message}
                    </span>
                  </div>
                )}
              </label>

              <div className="h-[330px]">
                <div className="label">
                  <span className="label-text">Tier Features</span>
                </div>
                {/* <textarea
                  {...register("featureDescription")}
                  className="textarea textarea-bordered h-24"
                  placeholder="What does this tier offer?"
                /> */}

                <Editor
                  height="200px"
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
              </div>
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
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
