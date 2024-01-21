import { zodResolver } from "@hookform/resolvers/zod";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

export const TierSchema = z.object({
  content: z.string().min(1, { message: "Required" }),
});

export default function AddTierModal() {
  const modalRef = useRef<HTMLDialogElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof TierSchema>>({
    resolver: zodResolver(TierSchema),
    defaultValues: { content: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof TierSchema>> = (data) => {};
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
          <h3 className="text-lg font-bold">Hello!</h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <input type="text" {...register("content")} />
              <button type="submit">
                {/* {createPostMutation.isLoading && ( */}
                <span className="loading loading-spinner"></span>
                {/* )} */}
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
