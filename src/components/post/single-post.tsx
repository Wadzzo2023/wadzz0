import clsx from "clsx";
import { Heart, Lock, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import { Post } from "@prisma/client";

import Avater from "../ui/avater";
import { PostContextMenu } from "./post-context-menu";
import { PostReadMore } from "./post-read-more";
import CommentView from "./comment";
import { AddComment } from "./add-comment";

export function SinglePostView({
  post,
  show = false,
  like,
  creator,
  priority,
}: {
  creator: { name: string; id: string };
  post: Post;
  show?: boolean;
  like: number;
  priority?: number;
}) {
  // return <div></div>;
  const likeMutation = api.post.likeApost.useMutation();
  const deleteLike = api.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.post.isLiked.useQuery(post.id);
  const comments = api.post.getComments.useQuery(post.id);

  return (
    <div className="flex h-full w-full flex-col rounded-box lg:flex-row">
      <div className="h-full flex-1 ">
        {post.mediaUrl && (
          <figure className="relative    h-full  w-full">
            <Image
              className={clsx(!show && "blur-sm", "")}
              src={post.mediaUrl}
              layout="fill"
              objectFit="contain"
              alt="Post Image"
            />
          </figure>
        )}
      </div>

      <div className="flex h-full w-full flex-1 ">
        <div className="h-full w-full overflow-y-hidden">
          <div
            key={post.id}
            className="h-full overflow-y-auto  rounded-none    shadow-xl scrollbar-hide"
          >
            <div className="card-body">
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div>
                    <Avater />
                  </div>
                  <div>
                    <Link href={`/creator/${creator.id}`} className="font-bold">
                      {creator.name}
                    </Link>
                    <p>
                      {priority && (
                        <span className="badge badge-secondary mr-1">
                          {priority}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <PostContextMenu creatorId={post.creatorId} postId={post.id} />
              </div>

              <div className="h-96 w-full bg-base-300 lg:hidden">
                {post.mediaUrl && (
                  <figure className="relative    h-full  w-full">
                    <Image
                      className={clsx(!show && "blur-sm", "")}
                      src={post.mediaUrl}
                      layout="fill"
                      objectFit="contain"
                      alt="Post Image"
                    />
                  </figure>
                )}
              </div>

              {!show ? (
                <h2 className="card-title">{post.heading}</h2>
              ) : (
                <Link href={`/posts/${post.id}`}>
                  <h2 className="card-title">{post.heading}</h2>
                </Link>
              )}

              <>
                <PostReadMore post={post} />
                {formatPostCreatedAt(post.createdAt)}

                <div className="mt-10 flex flex-col gap-4">
                  <div className="flex flex-col gap-4">
                    {comments.data?.map((comment) => (
                      <CommentView key={comment.id} comment={comment} />
                    ))}
                  </div>
                </div>
                <div className="">
                  <AddComment postId={post.id} />
                </div>

                <div className="flex gap-4 p-2 ">
                  <div className="flex items-center justify-center gap-1">
                    {deleteLike.isLoading || likeMutation.isLoading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <div className="btn btn-circle btn-ghost btn-sm">
                        <Heart
                          onClick={() =>
                            liked
                              ? deleteLike.mutate(post.id)
                              : likeMutation.mutate(post.id)
                          }
                          className={clsx(
                            liked && "fill-primary text-primary ",
                          )}
                        />
                      </div>
                    )}
                    <p className="font-bold">{like}</p>
                  </div>

                  <Link className="" href={`/posts/${post.id}`}>
                    <div className="flex items-center justify-center gap-1">
                      <div className="btn btn-circle btn-ghost btn-sm">
                        <MessageCircle />
                      </div>{" "}
                      <p className="font-bold">{comments.data?.length ?? 0}</p>
                    </div>
                  </Link>
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
