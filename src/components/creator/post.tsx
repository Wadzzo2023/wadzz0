import { Post } from "@prisma/client";
import clsx from "clsx";
import { Heart, MessageCircle, Share2, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import Avater from "../ui/avater";

export function PostCard({
  post,
  show = false,
  like,
  comments,
  creator,
}: {
  creator: { name: string; id: string };
  post: Post;
  show?: boolean;
  like: number;
  comments: number;
}) {
  const likeMutation = api.post.likeApost.useMutation();
  const deleteLike = api.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.post.isLiked.useQuery(post.id);

  return (
    <div
      key={post.id}
      className="card card-compact w-96  bg-neutral text-neutral-content shadow-xl"
    >
      {post.mediaUrl && (
        <figure className="relative h-40  w-full">
          <Image
            className={clsx(!show && "blur-sm")}
            src={post.mediaUrl}
            layout="fill"
            objectFit="cover"
            alt="Post Image"
          />
        </figure>
      )}
      <div className="card-body">
        <div className="flex gap-2">
          <Avater />
          <div>
            <Link href={`/creator/${creator.id}`} className="font-bold">
              {creator.name}
            </Link>
            <p>
              {formatPostCreatedAt(post.createdAt)}. {post.subscriptionId}
            </p>
          </div>
        </div>

        <h2 className="card-title">{post.heading}</h2>

        {!show ? (
          <button className="btn ">
            <Lock />
            Unlock Post
          </button>
        ) : (
          <>
            <p>{post.content}</p>
            <Link href={`/posts/${post.id}`} className="text-primary underline">
              Read more
            </Link>
            <div className="flex gap-4 p-2 ">
              <div className="flex items-end justify-center gap-1">
                {deleteLike.isLoading || likeMutation.isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <Heart
                    onClick={() =>
                      liked
                        ? deleteLike.mutate(post.id)
                        : likeMutation.mutate(post.id)
                    }
                    className={clsx(liked && "fill-primary text-primary ")}
                  />
                )}
                <p className="font-bold">{like}</p>
              </div>
              <div className="flex items-end justify-center gap-1">
                <MessageCircle /> <p className="font-bold">{comments}</p>
              </div>
              <Share2 size={20} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
