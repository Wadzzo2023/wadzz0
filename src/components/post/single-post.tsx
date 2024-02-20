import clsx from "clsx";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import Avater from "../ui/avater";
import { AddComment } from "./add-comment";
import CommentView from "./comment";
import { PostContextMenu } from "./post-context-menu";
import { PostReadMore } from "./post-read-more";

export function SinglePostView({ postId }: { postId: number }) {
  const post = api.post.getAPost.useQuery(postId, {
    refetchOnWindowFocus: false,
  });

  // return <div></div>;
  const likeMutation = api.post.likeApost.useMutation();
  const deleteLike = api.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.post.isLiked.useQuery(postId);
  const comments = api.post.getComments.useQuery(postId);
  if (post.isLoading) return <div>Loading...</div>;

  if (post.isError) return <div>Post not found</div>;
  if (post.data)
    return (
      <div className="flex h-full w-full flex-col rounded-box lg:flex-row">
        <div className="h-full flex-1 ">
          {post.data.Media.length > 0 && post.data.Media[0]?.url && (
            <figure className="relative    h-full  w-full">
              <Image
                src={post.data.Media[0]?.url}
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
              key={post.data.id}
              className="h-full overflow-y-auto  rounded-none    shadow-xl scrollbar-hide"
            >
              <div className="card-body">
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <div>
                      <Avater />
                    </div>
                    <div>
                      <Link
                        href={`/creator/${post.data.creator.id}`}
                        className="font-bold"
                      >
                        {post.data.creator.name}
                      </Link>
                      <p>
                        <span className="badge badge-secondary mr-1">
                          {post.data.subscription?.priority}
                        </span>
                      </p>
                    </div>
                  </div>
                  <PostContextMenu
                    creatorId={post.data.creatorId}
                    postId={post.data.id}
                  />
                </div>

                <div className="h-96 w-full bg-base-300 lg:hidden">
                  <div>
                    {post.data.Media.map((el) => (
                      <figure className="relative    h-full  w-full">
                        <Image
                          src={el.url}
                          layout="fill"
                          objectFit="contain"
                          alt="Post Image"
                        />
                      </figure>
                    ))}
                  </div>
                </div>

                <Link href={`/posts/${post.data.id}`}>
                  <h2 className="card-title">{post.data.heading}</h2>
                </Link>

                <PostReadMore post={post.data} />
                {formatPostCreatedAt(post.data.createdAt)}

                <div className="mt-10 flex flex-col gap-4">
                  <div className="flex flex-col gap-4">
                    {comments.data?.map((comment) => (
                      <CommentView key={comment.id} comment={comment} />
                    ))}
                  </div>
                </div>
                <div className="">
                  <AddComment postId={post.data.id} />
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
                              ? deleteLike.mutate(postId)
                              : likeMutation.mutate(postId)
                          }
                          className={clsx(
                            liked && "fill-primary text-primary ",
                          )}
                        />
                      </div>
                    )}
                    <p className="font-bold">{post.data._count.Like}</p>
                  </div>

                  <Link className="" href={`/posts/${post.data.id}`}>
                    <div className="flex items-center justify-center gap-1">
                      <div className="btn btn-circle btn-ghost btn-sm">
                        <MessageCircle />
                      </div>{" "}
                      <p className="font-bold">{comments.data?.length ?? 0}</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  else {
    return <p> You do not have proper permission</p>;
  }
}
