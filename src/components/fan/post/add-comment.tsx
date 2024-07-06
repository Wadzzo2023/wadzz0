import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";

export const CommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(5, { message: "Minimum 5 character is required!" }),
});

export function AddComment({ postId }: { postId: number }) {
  const commentM = api.fan.post.createComment.useMutation({
    onSuccess: () => {
      reset();
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof CommentSchema>>({
    resolver: zodResolver(CommentSchema),
    defaultValues: { postId: postId },
  });

  const onSubmit: SubmitHandler<z.infer<typeof CommentSchema>> = (data) => {
    commentM.mutate(data);
  };

  return (
    <div className="flex w-full flex-col">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control w-full ">
          <div className="flex  items-center gap-2">
            <textarea
              {...register("content")}
              className=" textarea textarea-bordered w-full"
            />
            <button className="btn" type="submit">
              {commentM.isLoading && (
                <span className="loading loading-spinner" />
              )}
              <Send size={14} /> Comment
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
