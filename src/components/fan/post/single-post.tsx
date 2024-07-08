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
import { Separator } from "~/components/shadcn/ui/separator";
import Image from "next/image";

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
      <div className="flex h-full  flex-1 flex-col items-center  md:p-5">
        <h2 className="mb-5 text-center text-2xl font-bold">
          Post by {post.data.creator.name}
        </h2>
        <div className=" w-full  flex-1  overflow-auto rounded-box ">
          <div className="h-full overflow-auto">
            <div className="flex  w-full flex-col items-center justify-between overflow-auto  lg:flex-row">
              {post.data.medias.length > 0 && (
                <div className="hidden  h-full flex-1   lg:flex">
                  <Slider
                    className="max-h-[400px] min-h-[400px]"
                    images={post.data.medias.map((el) => el.url)}
                  />
                </div>
              )}

              <div className="flex h-full w-full flex-1 overflow-auto rounded-box bg-base-100">
                <div className="h-full w-full  overflow-auto">
                  <div
                    key={post.data.id}
                    className="h-full  overflow-auto  rounded-none   shadow-xl scrollbar-hide"
                  >
                    <div className="flex h-full flex-col overflow-auto pt-6 md:px-6">
                      <div>
                        <div className="flex justify-between">
                          <div className="flex gap-2">
                            <div className="h-auto w-auto rounded-full">
                              <Image
                                height={100}
                                width={100}
                                className="h-12 w-12 cursor-pointer rounded-full object-cover shadow"
                                alt="User avatar"
                                src={post.data.creator.profileUrl ?? ""}
                              />
                            </div>
                            <div>
                              <Link
                                href={creatorProfileUrl}
                                className="font-bold"
                              >
                                {post.data.creator.name}
                              </Link>
                              <p className="text-xs">
                                Posted on{" "}
                                {formatPostCreatedAt(post.data.createdAt)}
                              </p>
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
                      </div>

                      <div className=" mt-3 w-full rounded-lg border border-gray-200 bg-white py-4 shadow scrollbar-hide dark:border-gray-700 dark:bg-gray-800">
                        <div className="h-full ">
                          <div className="flex h-full flex-col justify-between ">
                            <div>
                              <div className=" flex flex-col rounded-lg  lg:hidden">
                                <Slider
                                  className="aspect-square max-h-[400px] min-h-[400px]"
                                  images={post.data.medias.map((el) => el.url)}
                                />
                              </div>
                              <h2 className="card-title px-4 py-4 md:py-0">
                                {post.data.heading}
                              </h2>
                              {/* <p>{post.data.content}</p> */}
                              <Preview value={post.data.content} />
                            </div>

                            {comments.data && comments.data.length > 0 && (
                              <div className="mt-10 flex flex-col gap-4 border-t-2 border-t-base-100">
                                <div className="flex flex-col gap-4 rounded-lg  py-4 pl-4">
                                  {comments.data?.map((comment) => (
                                    <>
                                      <CommentView
                                        key={comment.id}
                                        comment={comment}
                                      />
                                      <Separator />
                                    </>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom section */}
                      <div className="w-full self-baseline ">
                        <div className="mt-15 w-full   pt-2">
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
