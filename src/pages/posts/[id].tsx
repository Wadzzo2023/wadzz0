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
import ContextMenu from "~/components/ui/context-menu";
import { useSession } from "next-auth/react";

export default function PostPage() {
  const router = useRouter();
  const postId = router.query.id;

  if (typeof postId == "string") {
    return <Page postId={postId} />;
  }

  return <div>Error</div>;
}

function Page({ postId }: { postId: string }) {
  const post = api.post.getAPost.useQuery(Number(postId));
  const { data: comments, isLoading: commentLoading } =
    api.post.getComments.useQuery(Number(postId));

  if (post.isLoading || commentLoading) return <div>Loading...</div>;

  if (post.isError) return <div>Post not found</div>;
  if (post.data) {
    return (
      <div className="p-5">
        <h2 className="mb-5 text-center text-3xl font-bold">Content</h2>
        <div className="flex w-full flex-col items-center pb-20">
          <>
            <PostCard
              priority={post.data.subscription?.priority}
              comments={post.data._count.Comment}
              creator={post.data.creator}
              like={post.data._count.Like}
              post={post.data}
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
        </div>
      </div>
    );
  } else {
    return <p> You do not have proper permission</p>;
  }
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
      <div className="flex gap-2">
        <p className=" text-right">{formatPostCreatedAt(comment.createdAt)}</p>

        <CommentContextMenu
          commentId={comment.id}
          commentorId={comment.userId}
        />
      </div>
    </div>
  );
}

function CommentContextMenu({
  commentorId,
  commentId,
}: {
  commentorId: string;
  commentId: number;
}) {
  const { data } = useSession();
  const deletePost = api.post.deleteComment.useMutation();

  const handleDelete = () => deletePost.mutate(commentId);

  if (data?.user && data.user.id === commentorId) {
    return (
      <ContextMenu
        bg="bg-base-300"
        handleDelete={handleDelete}
        isLoading={deletePost.isLoading}
      />
    );
  }
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
              {commentM.isLoading && (
                <span className="loading loading-spinner" />
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
