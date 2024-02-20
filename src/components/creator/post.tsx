import clsx from "clsx";
import { Heart, Lock, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import { Media, Post } from "@prisma/client";

import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";
import Avater from "../ui/avater";

export function PostCard({
  post,
  show = false,
  like,
  comments,
  creator,
  priority,
  media,
}: {
  creator: { name: string; id: string };
  post: Post;
  show?: boolean;
  like: number;
  comments: number;
  priority?: number;
  media?: Media;
}) {
  const likeMutation = api.post.likeApost.useMutation();
  const deleteLike = api.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.post.isLiked.useQuery(post.id);

  return (
    <div
      key={post.id}
      className="card card-compact w-96  bg-base-300  shadow-xl"
    >
      {media && (
        <figure className="relative h-40  w-full">
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
              <Avater />
            </div>
            <div>
              <Link href={`/creator/${creator.id}`} className="font-bold">
                {creator.name}
              </Link>
              <p>
                {priority && (
                  <span className="badge badge-secondary mr-1">{priority}</span>
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
          <Link href={`/posts/${post.id}`}>
            <h2 className="card-title">{post.heading}</h2>
          </Link>
        )}

        {!show ? (
          <Link href={`/creator/${post.creatorId}`} className="btn ">
            <Lock />
            Unlock Post
          </Link>
        ) : (
          <>
            <PostReadMore post={post} />

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
                      className={clsx(liked && "fill-primary text-primary ")}
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
