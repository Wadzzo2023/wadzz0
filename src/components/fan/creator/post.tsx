import clsx from "clsx";
import { Heart, Lock, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import { Media, Post } from "@prisma/client";

import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";
import Avater from "../../ui/avater";
import { getBageStyle } from "./card";
import { Card, CardHeader, CardContent } from "~/components/shadcn/ui/card";

export function PostCard({
  post,
  show = false,
  like,
  comments,
  creator,
  priority,
  media,
}: {
  creator: { name: string; id: string; profileUrl: string | null };
  post: Post;
  show?: boolean;
  like: number;
  comments: number;
  priority?: number;
  media?: Media;
}) {
  const likeMutation = api.fan.post.likeApost.useMutation();
  const deleteLike = api.fan.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);
  console.log("media", media);

  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;

  return (
    <div
      key={post.id}
      className="card card-compact w-full bg-base-100  shadow-xl  md:w-[60%]"
    >
      {media && (
        <figure className="relative h-60  w-full">
          <Image
            className={clsx(!show && "blur-sm")}
            src={media.url}
            layout="fill"
            objectFit="cover"
            alt="Post Image"
          />
        </figure>
      )}
      <div className="card-body">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <div>
              <Avater url={creator.profileUrl} className="w-8" />
            </div>
            <div>
              <Link href={creatorProfileUrl} className="font-bold">
                {creator.name}
              </Link>
              <p>
                {priority && (
                  <span className={clsx("badge  mr-1", getBageStyle(priority))}>
                    {priority}
                  </span>
                )}
                {formatPostCreatedAt(post.createdAt)}
              </p>
            </div>
          </div>
          <PostContextMenu creatorId={post.creatorId} postId={post.id} />
        </div>

        {!show ? (
          <h2 className="card-title">{post.heading}</h2>
        ) : (
          <Link href={postUrl}>
            <h2 className="card-title">{post.heading}</h2>
          </Link>
        )}

        {!show ? (
          <Link href={creatorProfileUrl} className="btn ">
            <Lock />
            Unlock Post
          </Link>
        ) : (
          <>
            <PostReadMore post={post} />

            <div className="mt-4 flex items-center justify-start gap-2 border-t border-gray-600  px-10">
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
                      className={clsx(liked && "fill-primary text-primary ")}
                    />
                  </div>
                )}
                <p className="font-bold">{like}</p>
              </div>

              <Link className="" href={postUrl}>
                <div className="flex items-center justify-center gap-1">
                  <div className="btn btn-circle btn-ghost btn-sm">
                    <MessageCircle />
                  </div>{" "}
                  <p className="font-bold">{comments}</p>
                </div>
              </Link>
              {/* <Share2 size={20} /> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
