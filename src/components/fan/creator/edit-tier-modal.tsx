import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Editor } from "~/components/editor";
import { Button } from "~/components/shadcn/ui/button";
import { SubscriptionType } from "~/pages/fans/creator/[id]";
import { api } from "~/utils/api";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";

import toast from "react-hot-toast";

export const EditTierSchema = z.object({
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
  id: z.number(),
});

export default function EditTierModal({ item }: { item: SubscriptionType }) {
  const router = useRouter();
  const modalRef = useRef<HTMLDialogElement>(null);
  const mutation = api.fan.member.editTierModal.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm<z.infer<typeof EditTierSchema>>({
    resolver: zodResolver(EditTierSchema),
    defaultValues: {
      featureDescription: item.features,
      name: item.name,
      price: item.price,
      id: item.id,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof EditTierSchema>> = (data) => {
    // setIsModalOpen(true);
    // trxMutation.mutate({ code: getValues("name") });
    mutation.mutate(data);
  };

  const handleModal = () => {
    modalRef.current?.showModal();
  };
  function handleEditorChange(value: string): void {
    setValue("featureDescription", value);

    // throw new Error("Function not implemented.");
  }

  if (router.pathname == "/fans/creator")
    return (
      <>
        <button className="btn btn-circle btn-primary" onClick={handleModal}>
          <Pencil className="" />
        </button>
        <dialog id="my_modal_1" className="modal" ref={modalRef}>
          <div className="modal-box">
            <h3 className="text-center text-lg font-bold">Edit</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex w-full flex-col  items-center  gap-2 py-8"
            >
              <div className="rounded-md ">
                <label className="form-control w-full ">
                  <div className="label">
                    <span className="label-text">Tier Name</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Name of the tier"
                    {...register("name")}
                    className="input input-bordered w-full "
                  />
                  {errors.name && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.name.message}
                      </span>
                    </div>
                  )}
                </label>
                <label className="form-control w-full ">
                  <div className="label">
                    <span className="label-text">Price</span>
                  </div>
                  <input
                    {...register("price", { valueAsNumber: true })}
                    className="input input-bordered w-full "
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Price"
                  ></input>
                  {errors.price && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        {errors.price.message}
                      </span>
                    </div>
                  )}
                </label>
                <label className="form-control w-full ">
                  <div className="label">
                    <span className="label-text">Tier Features</span>
                  </div>
                  <Editor
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
              </div>
              <div className="  mt-16 flex w-full flex-col  items-center gap-2 ">
                <Button
                  className="w-full max-w-xs"
                  type="submit"
                  disabled={mutation.isLoading}
                >
                  {mutation.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Save Changes
                </Button>
                <DeleteTier id={item.id} />
              </div>
            </form>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>
              </form>
            </div>
          </div>
        </dialog>
      </>
    );
}

function DeleteTier({ id }: { id: number }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const mutation = api.fan.member.deleteTier.useMutation({
    onSuccess: () => {
      toast.success("Tier deleted");
      setIsOpen(false);
    },
  });
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            className="btn btn-primary mt-2 w-full max-w-xs"
            type="button"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading && (
              <span className="loading loading-spinner"></span>
            )}
            Delete Tier
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div>
            <p>
              Are you sure you want to delete this tier? This action is
              irreversible.
            </p>
          </div>
          <DialogFooter className=" w-full">
            <div className="flex w-full gap-4  ">
              <DialogClose className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                type="submit"
                onClick={() => mutation.mutate({ id })}
                disabled={mutation.isLoading}
                className="w-full"
              >
                {mutation.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
