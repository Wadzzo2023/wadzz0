import { Post } from "@prisma/client";
import clsx from "clsx";
import { Heart, MessageCircle, Share2, Lock } from "lucide-react";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

export function PostCard({
  post,
  show = false,
  like,
}: {
  post: Post;
  show?: boolean;
  like: number;
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
      <figure>
        <img
          className="h-36"
          src={
            post.mediaUrl ??
            "https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
          }
          alt="Post Image"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{post.heading}</h2>
        <p>
          {formatPostCreatedAt(post.createdAt)}. {post.subscriptionId}
        </p>
        {!show ? (
          <button className="btn ">
            <Lock />
            Unlock Post
          </button>
        ) : (
          <>
            <p>{post.content}</p>
            <Link
              href={`/posts/${post.id}?creator=${post.creatorId}`}
              className="text-primary underline"
            >
              Read more
            </Link>
            <div className="flex gap-4 p-2 ">
              <div className="flex items-end justify-center gap-1">
                <Heart
                  onClick={() =>
                    liked
                      ? deleteLike.mutate(post.id)
                      : likeMutation.mutate(post.id)
                  }
                  className={clsx(liked && "fill-primary text-primary ")}
                />{" "}
                <p className="font-bold">{like}</p>
              </div>
              <div className="flex items-end justify-center gap-1">
                <MessageCircle /> <p className="font-bold">4</p>
              </div>
              <Share2 size={20} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
