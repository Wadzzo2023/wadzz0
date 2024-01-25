import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { PostCard } from "~/components/creator/CreatPost";
import Avater from "~/components/ui/avater";
import { api } from "~/utils/api";

import { Comment } from "@prisma/client";
import { formatPostCreatedAt } from "~/utils/format-date";

export default function PostPage() {
  const router = useRouter();
  const postId = router.query.id;
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator");

  if (typeof postId == "string" && creatorId) {
    return <Page postId={postId} creator={creatorId} />;

    // URL -> `/dashboard?search=my-project`
    // `search` -> 'my-project'
  }

  return <div>Error</div>;
}

function Page({ postId, creator }: { postId: string; creator: string }) {
  const { data, isLoading } = api.post.getAPost.useQuery(Number(postId));
  const { data: comments, isLoading: commentLoading } =
    api.post.getComments.useQuery(Number(postId));
  return (
    <div className="flex w-full flex-col items-center">
      {data && (
        <>
          <PostCard post={data} show />
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Comments</h2>
              {comments?.map((comment) => <CommentView comment={comment} />)}
              <AddComment postId={postId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function CommentView({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2">
      <div>
        <Avater />
      </div>
      <div className="flex-1">
        <h2>Username</h2>
        <p>{comment.content}</p>
      </div>
      <p>{formatPostCreatedAt(comment.createdAt)}</p>
    </div>
  );
}
export const CommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(5, { message: "Minimum 20 is reguired" }),
});

function AddComment({ postId }: { postId: string }) {
  const commentM = api.post.createComment.useMutation({
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
    defaultValues: { postId: Number(postId) },
  });

  const onSubmit: SubmitHandler<z.infer<typeof CommentSchema>> = (data) => {
    commentM.mutate(data);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control w-full max-w-xs">
          <div className="flex gap-2">
            <input
              type="text"
              {...register("content")}
              className="input input-bordered w-full max-w-xs"
            />
            <button className="btn" type="submit">
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
