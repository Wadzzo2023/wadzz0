import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const TierSchema = z.object({
  content: z.string().min(10, { message: "Required" }),
  featureDescription: z
    .string()
    .min(20, { message: "Make description longer" }),
  id: z.string(),
});

export default function AddTierModal({ creator }: { creator: Creator }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const mutation = api.member.createMembership.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof TierSchema>>({
    resolver: zodResolver(TierSchema),
    defaultValues: { id: creator.id },
  });

  const onSubmit: SubmitHandler<z.infer<typeof TierSchema>> = (data) =>
    mutation.mutate(data);
  // createPostMutation.mutate({ ...data, pubkey: props.id });

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={handleModal}>
        Add a Tier
      </button>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="text-lg font-bold">Create a subscription tier!</h3>
          <div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Content</span>
                </div>
                <input
                  type="text"
                  placeholder="$1/month"
                  {...register("content")}
                  className="input input-bordered w-full max-w-xs"
                />
                {errors.content && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.content.message}
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
                  placeholder="Description ..."
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
                className="btn btn-primary"
                type="submit"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading && (
                  <span className="loading loading-spinner"></span>
                )}
                Create Post{" "}
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
