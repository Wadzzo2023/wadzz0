import { zodResolver } from "@hookform/resolvers/zod";

import { Send } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const BountyCommentSchema = z.object({
  bountyId: z.number(),
  parentId: z.number().optional(),
  content: z
    .string()
    .min(1, { message: "Minimum 5 character is required!" })
    .trim(),
});

export function AddBountyComment({ bountyId }: { bountyId: number }) {
  const createBountyCommentMutation =
    api.bounty.Bounty.createBountyComment.useMutation({
      onSuccess: () => {
        reset();
      },
    });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof BountyCommentSchema>>({
    resolver: zodResolver(BountyCommentSchema),
    defaultValues: { bountyId: bountyId },
  });
  const contentValue = watch("content");

  const onSubmit: SubmitHandler<z.infer<typeof BountyCommentSchema>> = (
    data,
  ) => {
    createBountyCommentMutation.mutate(data);
  };

  return (
    <div className=" px-4 pb-2 ">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control ">
          <div className="flex items-center  gap-2">
            <textarea
              {...register("content")}
              className="textarea textarea-bordered h-10 w-full resize-none"
            />
            <button
              disabled={
                createBountyCommentMutation.isLoading || !contentValue?.trim()
              }
              className="btn"
              type="submit"
            >
              {createBountyCommentMutation.isLoading ? (
                <span className="loading loading-spinner h-5 w-5" />
              ) : (
                <Send size={14} />
              )}
              Comment
            </button>
          </div>
          {errors.content && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.content.message}
              </span>
            </div>
          )}
        </label>
      </form>
    </div>
  );
}
