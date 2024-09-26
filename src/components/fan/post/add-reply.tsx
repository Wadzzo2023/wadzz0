import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";
import { CommentSchema } from "./add-comment";

export function AddReplyComment({
  parentId,
  postId,
}: {
  parentId: number;
  postId: number;
}) {
  const commentM = api.fan.post.createComment.useMutation({
    onSuccess: (data) => {
      // console.log(data);
      reset();
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof CommentSchema>>({
    resolver: zodResolver(CommentSchema),
    defaultValues: { parentId: parentId, postId: postId, content: "" },
  });
  const contentValue = watch("content");
  const onSubmit: SubmitHandler<z.infer<typeof CommentSchema>> = (data) => {
    commentM.mutate(data);
  };

  return (
    <div className=" w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control w-full ">
          <div className="flex w-full  items-center gap-2">
            <textarea
              {...register("content")}
              className=" textarea textarea-bordered h-10 w-full"
            />
            <button
              disabled={commentM.isLoading || !contentValue?.trim()}
              className="btn "
              type="submit"
            >
              {commentM.isLoading && (
                <span className="loading loading-spinner" />
              )}
              <Send size={14} /> Reply
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
