import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { PostCard } from "~/components/creator/post";
import Avater from "~/components/ui/avater";
import { api } from "~/utils/api";

import { Comment } from "@prisma/client";
import { formatPostCreatedAt } from "~/utils/format-date";
import React from "react";

export default function PostPage() {
  const router = useRouter();
  const postId = router.query.id;

  if (typeof postId == "string") {
    return <Page postId={postId} />;
  }

  return <div>Error</div>;
}

function Page({ postId }: { postId: string }) {
  const { data, isLoading } = api.post.getAPost.useQuery(Number(postId));
  const { data: comments, isLoading: commentLoading } =
    api.post.getComments.useQuery(Number(postId));
  return (
    <div className="p-5">
      <div className="flex w-full flex-col items-center">
        {data && (
          <>
            <PostCard
              comments={data._count.Comment}
              creator={data.creator}
              like={data._count.Like}
              post={data}
              show
            />
            <div className="card w-96 bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Comments</h2>
                <div className="flex flex-col gap-4">
                  {comments?.map((comment) => (
                    <CommentView key={comment.id} comment={comment} />
                  ))}
                </div>
                <AddComment postId={postId} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function CommentView({
  comment,
}: {
  comment: Comment & {
    user: {
      name: string | null;
      image: string | null;
    };
  };
}) {
  return (
    <div className="flex justify-between border-b border-neutral">
      <div className="flex gap-2">
        <div>
          <Avater url={comment.user.image} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">{comment.user.name}</h2>
          {/* <p>{comment.content}</p> */}
          {comment.content.length > 50 ? (
            <ShowMore content={comment.content} />
          ) : (
            <p>{comment.content}</p>
          )}

          <p></p>
        </div>
      </div>
      <p className=" text-right">{formatPostCreatedAt(comment.createdAt)}</p>
    </div>
  );
}

function ShowMore({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  return (
    <>
      <p>{isExpanded ? content : content.slice(0, 50)}</p>
      {!isExpanded && (
        <button onClick={() => setIsExpanded(!isExpanded)}>See More</button>
      )}
    </>
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
