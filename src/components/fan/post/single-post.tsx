import clsx from "clsx";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import Avater from "../../ui/avater";
import { AddComment } from "./add-comment";
import CommentView from "./comment";
import { PostContextMenu } from "./post-context-menu";
import Slider from "../../ui/carosel";
import Loading from "~/components/wallete/loading";
import { Preview } from "~/components/preview";

export function SinglePostView({ postId }: { postId: number }) {
  const post = api.fan.post.getAPost.useQuery(postId, {
    refetchOnWindowFocus: false,
  });

  // return <div></div>;
  const likeMutation = api.fan.post.likeApost.useMutation();
  const deleteLike = api.fan.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.fan.post.isLiked.useQuery(postId);
  const comments = api.fan.post.getComments.useQuery(postId);

  if (post.isLoading) return <Loading />;

  if (post.isError) return <div>Post not found</div>;
  if (post.data) {
    const creatorProfileUrl = `/fans/creator/${post.data.creatorId}`;
    const postUrl = `/fans/posts/${post.data.id}`;
    return (
      <div className="flex h-full  flex-1 flex-col items-center  p-5">
        <h2 className="mb-5 text-center text-2xl font-bold">
          Post by {post.data.creator.name}
        </h2>
        <div className=" w-full  flex-1  overflow-auto rounded-box ">
          <div className="h-full overflow-auto">
            <div className="flex h-full w-full flex-col overflow-auto  lg:flex-row">
              {post.data.medias.length > 0 && (
                <div className="hidden h-full  flex-1 lg:flex">
                  <Slider images={post.data.medias.map((el) => el.url)} />
                </div>
              )}

              <div className="flex h-full w-full flex-1 overflow-auto rounded-box bg-base-100">
                <div className="h-full w-full  overflow-auto">
                  <div
                    key={post.data.id}
                    className="h-full  overflow-auto  rounded-none   shadow-xl scrollbar-hide"
                  >
                    <div className="flex h-full flex-col overflow-auto px-6 pt-6">
                      <div>
                        <div className="flex justify-between">
                          <div className="flex gap-2">
                            <div>
                              <Avater className="w-8" />
                            </div>
                            <div>
                              <Link
                                href={creatorProfileUrl}
                                className="font-bold"
                              >
                                {post.data.creator.name}
                              </Link>
                              {/* <p>
                                {post.data.subscription && (
                                  <span className="badge badge-secondary mr-1">
                                    {post.data.subscription.price}
                                  </span>
                                )}
                              </p> */}
                            </div>
                          </div>
                          <PostContextMenu
                            creatorId={post.data.creatorId}
                            postId={post.data.id}
                          />
                        </div>
                        <h2 className="card-title">{post.data.heading}</h2>
                      </div>

                      <div className="flex-1 overflow-auto rounded-lg bg-base-200 px-2 py-4 scrollbar-hide">
                        <div className="h-full">
                          <div className="flex h-full flex-col justify-between">
                            <div>
                              <div className=" flex flex-col rounded-lg  lg:hidden">
                                <Slider
                                  images={post.data.medias.map((el) => el.url)}
                                />
                              </div>

                              {/* <p>{post.data.content}</p> */}
                              <Preview value={post.data.content} />
                              <p>{formatPostCreatedAt(post.data.createdAt)}</p>
                            </div>

                            {comments.data && comments.data.length > 0 && (
                              <div className="mt-10 flex flex-col gap-4 border-t-2 border-t-base-100">
                                <div className="flex flex-col gap-4 rounded-lg bg-base-200 py-4 pl-4">
                                  {comments.data?.map((comment) => (
                                    <CommentView
                                      key={comment.id}
                                      comment={comment}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom section */}
                      <div className="w-full self-baseline ">
                        <div className="mt-15 w-full max-w-lg  pt-2">
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
                            <p className="font-bold">
                              {post.data._count.likes}
                            </p>
                          </div>

                          <Link className="" href={postUrl}>
                            <div className="flex items-center justify-center gap-1">
                              <div className="btn btn-circle btn-ghost btn-sm">
                                <MessageCircle />
                              </div>{" "}
                              <p className="font-bold">
                                {comments.data?.length ?? 0}
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return <p> You do not have proper permission</p>;
  }
}
