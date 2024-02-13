import { zodResolver } from "@hookform/resolvers/zod";
import { Subscription } from "@prisma/client";
import { Pencil } from "lucide-react";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const EditTierSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Minimum 4 charecter" })
    .max(12, { message: "Maximum 12 charecter" })
    .refine(
      (value) => {
        // Check if the input is a single word
        return /^\w+$/.test(value);
      },
      {
        message: "Input must be a single word",
      },
    ),

  price: z.number().min(1),
  featureDescription: z
    .string()
    .min(20, { message: "Make description longer" }),
  id: z.number(),
});

export default function EditTierModal({ item }: { item: Subscription }) {
  const router = useRouter();
  const modalRef = useRef<HTMLDialogElement>(null);
  const mutation = api.member.editTierModal.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
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

  if (router.pathname == "/creator/me")
    return (
      <>
        <button className="btn btn-circle btn-ghost" onClick={handleModal}>
          <Pencil />
        </button>
        <dialog id="my_modal_1" className="modal" ref={modalRef}>
          <div className="modal-box">
            <h3 className="text-center text-lg font-bold">Edit</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col items-center  gap-2 rounded-md bg-base-300 py-8"
            >
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Name of the tier"
                  {...register("name")}
                  className="input input-bordered w-full max-w-xs"
                />
                {errors.name && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.name.message}
                    </span>
                  </div>
                )}
              </label>
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Price</span>
                </div>
                <input
                  {...register("price", { valueAsNumber: true })}
                  className="input input-bordered w-full max-w-xs"
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
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Features</span>
                </div>
                <textarea
                  {...register("featureDescription")}
                  className="textarea textarea-bordered h-24"
                  placeholder="What does this tier offer?"
                ></textarea>
                {errors.featureDescription && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.featureDescription.message}
                    </span>
                  </div>
                )}
              </label>

              <button
                className="btn btn-primary mt-2 w-full max-w-xs"
                type="submit"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading && (
                  <span className="loading loading-spinner"></span>
                )}
                Edit Tier
              </button>
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
