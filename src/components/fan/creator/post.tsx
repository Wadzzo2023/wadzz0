import clsx from "clsx";
import { Heart, Lock, MessageCircle, ShareIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import { Comment, Media, Post } from "@prisma/client";

import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";
import Avater from "../../ui/avater";
import { getBageStyle } from "./card";
import { Card, CardHeader, CardContent } from "~/components/shadcn/ui/card";
import { Button } from "~/components/shadcn/ui/button";
import { AddComment } from "../post/add-comment";
import { useState } from "react";
import CommentView from "../post/comment";
import { Separator } from "~/components/shadcn/ui/separator";
import { FacebookShareButton, FacebookIcon } from "next-share";
import { useModal } from "~/lib/state/play/use-modal-store";
export function PostCard({
  post,
  show = false,
  likeCount,
  commentCount,
  creator,
  priority,
  media,
}: {
  creator: { name: string; id: string; profileUrl: string | null };
  post: Post;
  show?: boolean;
  likeCount: number;
  commentCount: number;
  priority?: number;
  media?: Media[];
}) {
  const likeMutation = api.fan.post.likeApost.useMutation();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const deleteLike = api.fan.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);

  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;
  const { onOpen } = useModal();
  return (
    // <div
    //   key={post.id}
    //   className="card card-compact w-full bg-base-100  shadow-xl  md:w-[60%]"
    // >
    //   {media && (
    //     <figure className="relative h-60  w-full">
    //       <Image
    //         className={clsx(!show && "blur-sm")}
    //         src={media.url}
    //         layout="fill"
    //         objectFit="cover"
    //         alt="Post Image"
    //       />
    //     </figure>
    //   )}
    //   <div className="card-body">
    //     <div className="flex justify-between">
    //       <div className="flex gap-2">
    //         <div>
    //           <Avater url={creator.profileUrl} className="w-8" />
    //         </div>
    //         <div>
    //           <Link href={creatorProfileUrl} className="font-bold">
    //             {creator.name}
    //           </Link>
    //           <p>
    //             {priority && (
    //               <span className={clsx("badge  mr-1", getBageStyle(priority))}>
    //                 {priority}
    //               </span>
    //             )}
    //             {formatPostCreatedAt(post.createdAt)}
    //           </p>
    //         </div>
    //       </div>
    //       <PostContextMenu creatorId={post.creatorId} postId={post.id} />
    //     </div>

    //     {!show ? (
    //       <h2 className="card-title">{post.heading}</h2>
    //     ) : (
    //       <Link href={postUrl}>
    //         <h2 className="card-title">{post.heading}</h2>
    //       </Link>
    //     )}

    //     {!show ? (
    //       <Link href={creatorProfileUrl} className="btn ">
    //         <Lock />
    //         Unlock Post
    //       </Link>
    //     ) : (
    //       <>
    //         <PostReadMore post={post} />

    //         <div className="mt-4 flex items-center justify-start gap-2 border-t border-gray-600  px-10">
    //           <div className="flex items-center justify-center gap-1">
    //             {deleteLike.isLoading || likeMutation.isLoading ? (
    //               <span className="loading loading-spinner"></span>
    //             ) : (
    //               <div className="btn btn-circle btn-ghost btn-sm">
    //                 <Heart
    //                   onClick={() =>
    //                     liked
    //                       ? deleteLike.mutate(post.id)
    //                       : likeMutation.mutate(post.id)
    //                   }
    //                   className={clsx(liked && "fill-primary text-primary ")}
    //                 />
    //               </div>
    //             )}
    //             <p className="font-bold">{like}</p>
    //           </div>

    //           <Link className="" href={postUrl}>
    //             <div className="flex items-center justify-center gap-1">
    //               <div className="btn btn-circle btn-ghost btn-sm">
    //                 <MessageCircle />
    //               </div>{" "}
    //               <p className="font-bold">{comments}</p>
    //             </div>
    //           </Link>
    //           {/* <Share2 size={20} /> */}
    //         </div>
    //       </>
    //     )}
    //   </div>
    // </div>

    <div className="m-1 w-full rounded-lg px-1 md:px-10">
      <div className=" ">
        <div className=" rounded-lg  bg-white shadow-lg">
          <div className="mx-3 flex flex-row px-2 py-3">
            <div className="h-auto w-auto rounded-full">
              <Avater className="h-12 w-12" url={creator.profileUrl} />
            </div>
            <div className="mb-2 ml-4 mt-1 flex flex-col">
              <Link
                href={creatorProfileUrl}
                className="text-sm font-semibold text-gray-600"
              >
                {creator.name}
              </Link>
              <div className="mt-1 flex w-full">
                <div className="font-base mr-1 cursor-pointer text-xs text-blue-700">
                  <p>
                    {priority && (
                      <span
                        className={clsx("badge  mr-1", getBageStyle(priority))}
                      >
                        {priority}
                      </span>
                    )}
                    {formatPostCreatedAt(post.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!show ? (
            <Link href={postUrl}>
              <h2 className="card-title px-6">{post.heading}</h2>
            </Link>
          ) : (
            <Link href={postUrl}>
              <h2 className="card-title px-6">{post.heading}</h2>
            </Link>
          )}

          {!show ? (
            <Link href={creatorProfileUrl} className="btn w-full">
              <Lock />
              Unlock Post
            </Link>
          ) : (
            <>
              <Link href={postUrl}>
                <PostReadMore post={post} />
                {media && media?.length > 0 && (
                  <>
                    <div className="border-b border-gray-200 "></div>
                    <div className="mx-3 mb-7 mt-6 w-full px-2 text-sm font-medium text-gray-400">
                      <div
                        className={clsx(
                          media?.length == 1
                            ? " grid   grid-cols-1  gap-2"
                            : " grid   grid-cols-2  gap-2",
                        )}
                      >
                        {media && media?.length == 1 ? (
                          <div className="relative col-span-1 max-h-[250px] min-h-[250px] overflow-hidden rounded-xl md:max-h-[550px] md:min-h-[550px]">
                            <Image
                              height={1000}
                              width={1000}
                              className="h-full w-full object-fill "
                              src={media[0]?.url ?? ""}
                              alt=""
                            />
                          </div>
                        ) : (
                          media?.map((el, i) =>
                            i === 0 ? (
                              <div
                                key={i}
                                className="relative col-span-1 max-h-[250px] min-h-[250px] overflow-hidden rounded-xl md:max-h-[350px] md:min-h-[350px]"
                              >
                                <Image
                                  height={1000}
                                  width={1000}
                                  className="h-full w-full object-cover "
                                  src={media[0]?.url ?? ""}
                                  alt=""
                                />
                              </div>
                            ) : (
                              <div
                                key={i}
                                className="relative col-span-1 max-h-[250px] min-h-[250px] overflow-hidden rounded-xl md:max-h-[350px] md:min-h-[350px]"
                              >
                                <div className=" absolute inset-0 flex items-center  justify-center bg-slate-900/80 text-xl text-white">
                                  +{media.length - 1}
                                </div>
                                <Image
                                  height={1000}
                                  width={1000}
                                  className="h-full w-full object-cover  "
                                  src={media[1]?.url ?? ""}
                                  alt=""
                                />
                              </div>
                            ),
                          )
                        )}

                        {/* <div className="relative col-span-2 max-h-[10rem] overflow-hidden rounded-xl">
                    <div className="absolute inset-0 flex items-center  justify-center bg-slate-900/80 text-xl text-white">
                      + 23
                    </div>
                    <Image
                      height={16}
                      width={16}
                      className="h-full w-full object-cover "
                      src={"/public/images/icons/avatar-icon.png"}
                      alt=""
                    />
                  </div> */}
                      </div>
                    </div>
                  </>
                )}
              </Link>

              <div className=" flex items-start justify-center gap-2  p-4 ">
                <div className=" flex w-1/3 items-center justify-center gap-2 p-0">
                  <Button
                    variant="outline"
                    className="w-full gap-1"
                    disabled={deleteLike.isLoading || likeMutation.isLoading}
                    onClick={() =>
                      liked
                        ? deleteLike.mutate(post.id)
                        : likeMutation.mutate(post.id)
                    }
                  >
                    <Heart
                      size={14}
                      color={liked ? "red" : "black"}
                      className={clsx(liked && "text-red fill-red-500 ")}
                    />
                    <p className="font-bold">{likeCount}</p>
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
                  <Button variant="outline" className="w-full gap-1">
                    <MessageCircle size={14} className="" />

                    {commentCount > 0 ? (
                      <span> {commentCount} Comments</span>
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
              {/* {showCommentBox && (
                <div className="mt-15 w-full   p-5">
                  <AddComment postId={post.id} />
                </div>
              )} */}

              <AddComment postId={post.id} />

              {/* {comments.data && comments.data.length > 0 && (
                <div className="mt-1 flex flex-col  border-2 border-base-200">
                  <div className=" flex flex-col   px-4 py-2">
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
              )} */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
