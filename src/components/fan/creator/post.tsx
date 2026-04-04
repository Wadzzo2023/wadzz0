"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  Lock,
  LockOpen,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Media, Post } from "@prisma/client";

import { formatPostCreatedAt } from "~/utils/format-date";
import { api } from "~/utils/api";
import { useModal } from "~/lib/state/play/use-modal-store";
import { cn } from "~/lib/utils";

import { Card, CardContent, CardFooter, CardHeader } from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import { Button } from "~/components/shadcn/ui/button";
import { Separator } from "~/components/shadcn/ui/separator";

import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";
import { AddComment } from "../post/add-comment";
import CommentView from "../post/comment";
import Avater from "~/components/ui/avater";
import PostAudioPlayer from "~/components/PostAudioPlayer";
import PostVideoPlayer from "~/components/PostVideoPlayer";
import { usePostVideoMedia } from "~/components/context/PostVideoContext";
import { usePlayer } from "~/components/context/PlayerContext";
import DummyAudioPostPlayer from "~/components/DummyAudioPostPlayer";
import DummmyVideoPostPlayer from "~/components/DummyVideoPostPlayer";

export function PostCard({
  post,
  show = false,
  likeCount,
  commentCount,
  creator,
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
  const deleteLike = api.fan.post.unLike.useMutation();
  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const { setCurrentVideo, currentVideoPlayingId, setVideoCurrentPlayingId, isPlaying: isVideoPlaying } =
    usePostVideoMedia();
  const { setCurrentTrack, setCurrentAudioPlayingId, currentAudioPlayingId } = usePlayer();

  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;
  const { onOpen } = useModal();

  const comments = api.fan.post.getComments.useQuery({
    postId: post.id,
    limit: 5,
  });

  useEffect(() => {
    setCurrentVideo(null);
    setVideoCurrentPlayingId(null);
  }, [post.id, setCurrentVideo, setVideoCurrentPlayingId]);

  const renderMediaItem = (item: Media, creatorId: string) => {
    switch (item.type) {
      case "IMAGE":
        return (
          <Image
            key={item.id}
            src={item.url}
            alt="Post image"
            width={1200}
            height={900}
            className="h-[320px] w-full object-cover md:h-[460px]"
          />
        );
      case "VIDEO":
        return (
          <div
            className="flex h-[320px] w-full items-center justify-center bg-black/90 md:h-[460px]"
            onClick={() => {
              setCurrentTrack(null);
              setCurrentAudioPlayingId(null);
              if (!isVideoPlaying && currentVideoPlayingId !== item.id) {
                setCurrentVideo({
                  id: item.id,
                  creatorId,
                  src: item.url,
                  title: post.heading,
                });
                setVideoCurrentPlayingId(item.id);
              }
            }}
          >
            {currentVideoPlayingId === item.id ? (
              <PostVideoPlayer videoId={item.id} />
            ) : (
              <DummmyVideoPostPlayer
                videoId={item.id}
                name={post.heading}
                artist={creatorId}
                mediaUrl={item.url}
              />
            )}
          </div>
        );
      case "MUSIC":
        return (
          <div className="flex h-[320px] w-full items-center justify-center bg-zinc-100 md:h-[460px]">
            {currentAudioPlayingId === item.id ? (
              <PostAudioPlayer />
            ) : (
              <DummyAudioPostPlayer
                audioId={item.id}
                name={post.heading}
                artist={creatorId}
                creatorProfileUrl={creator.profileUrl}
                mediaUrl={item.url}
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex + 1 >= (media?.length ?? 0) ? 0 : prevIndex + 1,
    );
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex - 1 < 0 ? (media?.length ?? 1) - 1 : prevIndex - 1,
    );
  };

  return (
    <Card className="overflow-hidden rounded-none border-x-0 border-t-0 border-b border-zinc-200 bg-white shadow-none">
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link href={creatorProfileUrl}>
              <Avater className="h-11 w-11" url={creator.profileUrl} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link href={creatorProfileUrl} className="truncate text-base font-semibold text-zinc-900 hover:underline">
                  {creator.name}
                </Link>
                <Badge variant="outline" className="h-5 rounded px-1 text-[11px]">
                  {locked ? (
                    show ? (
                      <LockOpen className="mr-1 h-3 w-3" />
                    ) : (
                      <Lock className="mr-1 h-3 w-3" />
                    )
                  ) : (
                    <Globe className="mr-1 h-3 w-3" />
                  )}
                  {locked ? (show ? "Unlocked" : "Locked") : "Public"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{formatPostCreatedAt(post.createdAt)}</p>
            </div>
          </div>
          <PostContextMenu creatorId={creator.id} postId={post.id} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-3 pt-1">
        {post.heading && post.heading !== "Heading" ? (
          <Link href={postUrl}>
            <h2 className="text-lg font-semibold text-zinc-900">{post.heading}</h2>
          </Link>
        ) : null}

        {!show ? (
          <Link href={creatorProfileUrl}>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-center">
              <Lock className="mx-auto mb-2 h-5 w-5 text-zinc-500" />
              <p className="text-sm text-zinc-700">This post is locked. Follow creator rules to unlock.</p>
            </div>
          </Link>
        ) : (
          <>
            <Link href={postUrl}>
              <PostReadMore post={post} />
            </Link>

            {media && media.length > 0 ? (
              <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                {media[currentMediaIndex] ? renderMediaItem(media[currentMediaIndex], post.creatorId) : null}
                {media.length > 1 ? (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/90"
                      onClick={prevMedia}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/90"
                      onClick={nextMedia}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white">
                      {currentMediaIndex + 1}/{media.length}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </CardContent>

      {show ? (
        <CardFooter className="border-t border-zinc-200 px-3 py-2">
          <div className="flex w-full items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-auto gap-1.5 rounded-md px-2.5 text-zinc-600 hover:bg-zinc-100",
                liked && "font-medium text-red-500",
              )}
              disabled={deleteLike.isLoading || likeMutation.isLoading}
              onClick={() => (liked ? deleteLike.mutate(post.id) : likeMutation.mutate(post.id))}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              <span className="text-xs">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-auto gap-1.5 rounded-md px-2.5 text-zinc-600 hover:bg-zinc-100"
              onClick={() => setShowCommentBox(!showCommentBox)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{commentCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-auto gap-1.5 rounded-md px-2.5 text-zinc-600 hover:bg-zinc-100"
              onClick={() => onOpen("share", { postUrl })}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        </CardFooter>
      ) : null}

      {show ? (
        <div className="px-4 pb-3">
          <AddComment postId={post.id} />
        </div>
      ) : null}

      {showCommentBox && comments.isLoading ? (
        <div className="flex items-center justify-center p-2">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      ) : null}

      {showCommentBox && comments.data && comments.data.length > 0 ? (
        <div className="mt-1 flex flex-col border-t border-zinc-200 px-4 pb-4 pt-3">
          <div className="flex flex-col gap-3">
            {comments.data.map((comment) => (
              <div key={comment.id}>
                <CommentView comment={comment} childrenComments={comment.childComments} />
                <Separator className="mt-3" />
              </div>
            ))}
          </div>
          {commentCount > 5 ? (
            <div className="mt-2 flex items-center justify-center">
              <Link href={postUrl} className="text-sm text-zinc-600 hover:underline">
                See more
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
