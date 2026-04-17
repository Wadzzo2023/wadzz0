"use client";

import clsx from "clsx";
import { Heart, Lock, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { useState } from "react";

import { Comment, Media, Post } from "@prisma/client";
import { Separator } from "~/components/shadcn/ui/separator";
import Avater from "~/components/ui/avater";
import { Button } from "~/components/shadcn/ui/button";
import { AddComment } from "../post/add-comment";
import CommentView from "../post/comment";
import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";

export function LegacyPostCard({
  post,
  show = false,
  likeCount,
  commentCount,
  creator,
  priority,
  media,
  locked,
}: {
  creator: { name: string; id: string; profileUrl: string | null };
  post: Post;
  show?: boolean;
  likeCount: number;
  commentCount: number;
  priority?: number;
  media?: Media[];
  locked?: boolean;
}) {
  const likeMutation = api.fan.post.likeApost.useMutation();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const deleteLike = api.fan.post.unLike.useMutation();
  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);

  const comments = api.fan.post.getComments.useQuery({
    postId: post.id,
    limit: 1,
  });

  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;

  return (
    <div className="my-5 w-full rounded-lg px-1 md:px-10">
      <div className=" ">
        <div className=" rounded-lg  bg-white shadow-lg">
          <div className="mx-3 flex flex-row px-2 py-3">
            <div className="h-auto w-auto rounded-full">
              <Image
                height={1000}
                width={1000}
                className="h-12 w-12 cursor-pointer rounded-full object-cover shadow"
                alt="User avatar"
                src={creator.profileUrl ?? "/images/icons/avatar-icon.png"}
              />
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

          <div className="px-6 pb-2">
            <Link href={postUrl}>
              <h2 className="text-lg font-bold text-gray-800">
                {post.heading}
              </h2>
            </Link>
          </div>

          {!show ? (
            <Link
              href={creatorProfileUrl}
              className="flex w-full justify-center p-4"
            >
              <Button className="w-full gap-1 bg-[#3ba55c] text-white hover:bg-[#2d8f23]">
                <Lock className="h-4 w-4" />
                Unlock Post
              </Button>
            </Link>
          ) : (
            <>
              <div className="px-6">
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
                        </div>
                      </div>
                    </>
                  )}
                </Link>
              </div>

              <div className=" flex items-start justify-center gap-2  p-4 ">
                <div className=" flex w-full items-center justify-center gap-2 p-0">
                  {deleteLike.isLoading || likeMutation.isLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() =>
                        liked
                          ? deleteLike.mutate(post.id)
                          : likeMutation.mutate(post.id)
                      }
                    >
                      <Heart
                        color={liked ? "red" : "black"}
                        className={clsx(liked && "text-red fill-red-500 ")}
                      />
                      <p className="font-bold">{likeCount}</p>
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowCommentBox(!showCommentBox)}
                  className="flex w-full items-center justify-center gap-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  <p className="font-bold">{commentCount}</p>
                  comment
                </Button>
              </div>

              <div className="px-4 pb-2">
                <AddComment postId={post.id} />
              </div>
              <Link
                href={postUrl}
                className="px-5 text-blue-700 hover:underline"
              >
                View All Comments
              </Link>
              {comments.data && comments.data.length > 0 && (
                <div className="mt-1 flex flex-col  border-t border-gray-200">
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getBageStyle(priority: number) {
  if (priority === 1) return "bg-[#3ba55c] text-white border-none";
  if (priority === 2) return "bg-[#00a8fc] text-white border-none";
  if (priority === 3) return "bg-[#ffa500] text-white border-none";
  return "bg-gray-500 text-white border-none";
}
