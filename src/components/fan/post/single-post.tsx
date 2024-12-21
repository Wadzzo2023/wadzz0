import clsx from "clsx";
import { Heart, MessageCircle, ShareIcon } from "lucide-react";
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
import { Button } from "~/components/shadcn/ui/button";
import { useState } from "react";
import ReplyCommentView from "./reply";
import { useModal } from "~/lib/state/play/use-modal-store";

export function SinglePostView({ postId }: { postId: number }) {
  const post = api.fan.post.getAPost.useQuery(postId, {
    refetchOnWindowFocus: false,
  });
  const { onOpen } = useModal();
  // return <div></div>;
  const likeMutation = api.fan.post.likeApost.useMutation();
  const deleteLike = api.fan.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.fan.post.isLiked.useQuery(postId);
  const comments = api.fan.post.getComments.useQuery({
    postId,
  });
  const [commentBox, setCommentBox] = useState(false);
  if (post.isLoading) return <Loading />;
  // console.log("COMEMMNET", comments.data);
  if (post.isError) return <div>Post not found</div>;
  if (post.data) {
    const creatorProfileUrl = `/fans/creator/${post.data.creatorId}`;
    const postUrl = `/fans/posts/${post.data.id}`;
    return (
      <div className=" flex h-full flex-col  items-center  md:p-5 ">
        <h2 className="mb-5 text-center text-2xl font-bold">
          Post by {post.data.creator.name}
        </h2>
        <div className="w-full ">
          <div className=" ">
            <div className="flex  w-full flex-col items-center justify-between ">
              {post.data.medias.length > 0 && (
                <div className="  flex h-full">
                  <Slider
                    className="max-h-[400px] min-h-[400px] w-full  md:max-h-[500px]  md:min-h-[500px]"
                    images={post.data.medias.map((el) => el.url)}
                  />
                </div>
              )}

              <div className="flex h-full w-full flex-1 overflow-auto rounded-box bg-base-100">
                <div className="h-full w-full  overflow-auto">
                  <div
                    key={post.data.id}
                    className="h-full  w-full  overflow-auto  rounded-none   shadow-xl scrollbar-hide"
                  >
                    <div className="flex h-full w-full flex-col overflow-auto pt-6  md:px-6">
                      <div>
                        <div className="flex justify-between">
                          <div className="flex gap-2">
                            <div className="h-auto w-auto rounded-full">
                              <Avater
                                className="h-12 w-12"
                                url={post.data.creator.profileUrl}
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
                      <div className="mt-2">
                        <p className="ml-4 font-bold">{post.data.heading}</p>
                        <Preview value={post.data.content} />
                      </div>
                      <div className=" flex items-start justify-center gap-2  p-4 ">
                        <div className=" flex w-1/3 items-center justify-center gap-2 p-0">
                          <Button
                            variant="outline"
                            className="w-full gap-1"
                            disabled={
                              deleteLike.isLoading || likeMutation.isLoading
                            }
                            onClick={() =>
                              liked
                                ? deleteLike.mutate(postId)
                                : likeMutation.mutate(postId)
                            }
                          >
                            <Heart
                              size={14}
                              color={liked ? "red" : "black"}
                              className={clsx(
                                liked && "text-red fill-red-500 ",
                              )}
                            />
                            <p className="font-bold">
                              {post.data._count.likes}
                            </p>
                            {deleteLike.isLoading || likeMutation.isLoading ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              ""
                            )}
                          </Button>
                        </div>
                        <Link
                          href={postUrl}
                          className="flex w-1/3 items-center justify-center gap-1"
                        >
                          <Button
                            variant="outline"
                            className="w-full gap-1"
                            onClick={() => setCommentBox(true)}
                          >
                            <MessageCircle size={14} />
                            {post.data._count.comments > 0 ? (
                              <span> {post.data._count.comments} Comments</span>
                            ) : (
                              <span> 0 Comment</span>
                            )}
                          </Button>
                        </Link>
                        <Button
                          onClick={() => onOpen("share", { postUrl: postUrl })}
                          variant="outline"
                          className="w-1/3 gap-1"
                        >
                          <ShareIcon size={14} /> Share
                        </Button>
                        {/* <Share2 size={20} /> */}
                      </div>
                      {/* Bottom section */}
                      <div className="w-full ">
                        {/* {commentBox && (
                          <div className="mt-15 w-full   pt-2">
                            <AddComment postId={post.data.id} />
                          </div>
                        )} */}
                        <AddComment postId={post.data.id} />
                        {comments.data && comments.data.length > 0 && (
                          <div className="mb-10 px-4">
                            <div className=" flex flex-col gap-4 rounded-lg border-2 border-base-200 ">
                              <div className=" mt-1 flex flex-col gap-4  rounded-lg p-2">
                                {comments.data?.map((comment) => (
                                  <>
                                    <CommentView
                                      key={comment.id}
                                      comment={comment}
                                      childrenComments={comment.childComments}
                                    />
                                    <Separator />
                                  </>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
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
