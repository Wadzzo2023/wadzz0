import { zodResolver } from "@hookform/resolvers/zod";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const TierSchema = z.object({
  name: z.string().min(4, { message: "Required" }),
  description: z.string().min(20, { message: "Make description longer" }),
  id: z.string(),
});

export default function AddItem2Shop() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const mutation = api.member.createMembership.useMutation({
    onSuccess: () => {
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof TierSchema>>({
    resolver: zodResolver(TierSchema),
    defaultValues: { id: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof TierSchema>> = (data) => {};
  // mutation.mutate(data);
  // createPostMutation.mutate({ ...data, pubkey: props.id });

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button className="btn" onClick={handleModal}>
        Creat NFT Item
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="text-lg font-bold">Creat NFT</h3>
          <div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Enter Name"
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
                  <span className="label-text">Description</span>
                </div>
                <textarea
                  {...register("description")}
                  className="textarea textarea-bordered h-24"
                  placeholder="Description"
                ></textarea>
                {errors.description && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.description.message}
                    </span>
                  </div>
                )}
              </label>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading && (
                  <span className="loading loading-spinner"></span>
                )}
                Add Item
              </button>
            </form>
          </div>

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
