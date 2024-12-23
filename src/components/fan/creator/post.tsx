'use client'

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Lock, MessageCircle, Music, ImageIcon, Video, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPostCreatedAt } from "~/utils/format-date";
import { api } from "~/utils/api";
import { useModal } from "~/lib/state/play/use-modal-store";
import { Media, MediaType, Post } from "@prisma/client";

import { Card, CardHeader, CardContent, CardFooter } from "~/components/shadcn/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar";
import { Button } from "~/components/shadcn/ui/button";
import { Badge } from "~/components/shadcn/ui/badge";

import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";
import { AddComment } from "../post/add-comment";
import Avater from "~/components/ui/avater";

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
  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;
  const { onOpen } = useModal();

  const getBadgeStyle = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-500 text-white";
      case 2:
        return "bg-yellow-500 text-white";
      case 3:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  }

  const renderMediaItem = (item: Media) => {
    switch (item.type) {
      case 'IMAGE':
        return (
          <Image
            key={item.id}
            src={item.url}
            alt="Post image"
            width={500}
            height={300}
            className="rounded-lg object-cover  max-h-[400px] min-h-[400px] w-full  md:max-h-[500px]  md:min-h-[500px]"
          />
        );
      case 'VIDEO':
        return (
          <video
            key={item.id}
            src={item.url}
            controls
            className="max-h-[400px] min-h-[400px] w-full  md:max-h-[500px]  md:min-h-[500px] rounded-lg  object-cover"
          />
        );
      case 'MUSIC':
        return (
          <div className="max-h-[400px] min-h-[400px] w-full  md:max-h-[500px]  md:min-h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
            <audio
              key={item.id}
              src={item.url}
              controls
              className="w-full max-w-md"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex + 1 >= (media?.length ?? 0) ? 0 : prevIndex + 1
    );
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex - 1 < 0 ? (media?.length ?? 1) - 1 : prevIndex - 1
    );
  };

  return (
    <Card className="w-full bg-white shadow-lg">
      <CardHeader className="flex flex-row items-center space-y-0 px-4 py-3">
        <div className="h-auto w-auto rounded-full">
          <Avater className="h-12 w-12" url={creator.profileUrl} />
        </div>
        <div className="ml-4 flex flex-col">
          <Link
            href={creatorProfileUrl}
            className="text-sm font-semibold text-gray-600 hover:underline"
          >
            {creator.name}
          </Link>
          <div className="flex items-center text-xs text-blue-700">
            {priority && (
              <Badge variant="secondary" className={`mr-2 ${getBadgeStyle(priority)}`}>
                {priority}
              </Badge>
            )}
            {formatPostCreatedAt(post.createdAt)}
          </div>
        </div>
        <PostContextMenu creatorId={creator.id} postId={post.id} />
      </CardHeader>

      <CardContent className="px-6 bg-slate-50 rounded-xl">
        <Link href={postUrl}>
          <h2 className="text-xl font-bold mb-4">{post.heading}</h2>
        </Link>

        {!show ? (
          <Link href={creatorProfileUrl}>
            <Button className="w-full">
              <Lock className="mr-2" />
              Unlock Post
            </Button>
          </Link>
        ) : (
          <>
            <Link href={postUrl}>
              <PostReadMore post={post} />
            </Link>
            {media && media.length > 0 && (
              <div className="mt-4 relative">
                {media[currentMediaIndex] ? renderMediaItem(media[currentMediaIndex]) : null}
                {media.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={prevMedia}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={nextMedia}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

            )}
          </>
        )}
      </CardContent>

      {
        show && (
          <CardFooter className="flex justify-between px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              className="w-1/3"
              disabled={deleteLike.isLoading || likeMutation.isLoading}
              onClick={() => liked ? deleteLike.mutate(post.id) : likeMutation.mutate(post.id)}
            >
              <Heart
                size={14}
                className={`mr-2 ${liked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="font-bold">{likeCount}</span>
              {(deleteLike.isLoading || likeMutation.isLoading) && (
                <span className="loading loading-spinner loading-xs ml-2"></span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-1/3"
              onClick={() => setShowCommentBox(!showCommentBox)}
            >
              <MessageCircle size={14} className="mr-2" />
              {commentCount > 0 ? `${commentCount} Comments` : "0 Comments"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-1/3"
              onClick={() => onOpen("share", { postUrl: postUrl })}
            >
              <Share size={14} className="mr-2" />
              Share
            </Button>
          </CardFooter>
        )
      }

      {
        showCommentBox && show && (
          <div className="px-4 pb-4">
            <AddComment postId={post.id} />
          </div>
        )
      }
    </Card >
  );
}

