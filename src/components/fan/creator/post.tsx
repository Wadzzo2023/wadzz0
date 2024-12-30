'use client'

import { useEffect, useState } from "react";
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
import PostAudioPlayer from "~/components/PostAudioPlayer";
import PostVideoPlayer from "~/components/PostVideoPlayer";
import { usePostVideoMedia } from "~/components/context/PostVideoContext";
import { usePostAudioMedia } from "~/components/context/PostAudioContext";
import { usePlayer } from "~/components/context/PlayerContext";
import DummyAudioPostPlayer from "~/components/DummyAudioPostPlayer";
import DummmyVideoPostPlayer from "~/components/DummyVideoPostPlayer";
import { addrShort } from "~/utils/utils";
import CommentView from "../post/comment";
import { Separator } from "~/components/shadcn/ui/separator";

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
  const { setCurrentVideo, currentVideo, isPlaying, currentVideoPlayingId, setVideoCurrentPlayingId } = usePostVideoMedia();
  const { setCurrentTrack, currentAudioPlayingId, setCurrentAudioPlayingId } = usePlayer()
  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;
  const { onOpen } = useModal();
  const comments = api.fan.post.getComments.useQuery({
    postId: post.id,
    limit: 5,
  });
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

  useEffect(() => {
    if (currentVideo) {
      setCurrentVideo(null);
      setVideoCurrentPlayingId(null);
    }
  }, [post.id])

  const renderMediaItem = (item: Media, creatorId: string) => {
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
          <div
            className="max-h-[400px] min-h-[400px] w-full  md:max-h-[500px]  md:min-h-[500px] flex items-center justify-center bg-gray-100 rounded-lg"
            onClick={() => {
              setCurrentTrack(null);
              setCurrentAudioPlayingId(null);
              !isPlaying && currentVideoPlayingId !== item.id && setCurrentVideo({
                id: item.id,
                creatorId: creatorId,
                src: item.url,
                title: post.heading
              });
              setVideoCurrentPlayingId(item.id);
            }}
          >
            {
              currentVideoPlayingId === item.id ? (
                <PostVideoPlayer videoId={item.id} />
              ) : (
                <DummmyVideoPostPlayer videoId={item.id}
                  name={post.heading}
                  artist={creatorId}
                  mediaUrl={item.url}
                />
              )
            }
          </div>
        );
      case 'MUSIC':
        return (
          <div className="max-h-[400px] min-h-[400px] w-full  md:max-h-[500px]  md:min-h-[500px] flex items-center justify-center bg-gray-100 rounded-lg"
            onClick={() => {
              setCurrentVideo(null);
              setVideoCurrentPlayingId(null);
              if (!isPlaying && currentAudioPlayingId !== item.id) {
                setCurrentTrack({
                  albumId: 1,
                  artist: addrShort(creatorId, 7),
                  asset: {
                    creatorId: addrShort(creatorId, 7),
                    description: post.heading,
                    issuer: 'issuer',
                    limit: 0,
                    mediaType: MediaType.MUSIC,
                    privacy: 'PUBLIC',
                    tierId: 1,
                    code: 'video1',
                    id: 1,
                    mediaUrl: item.url,
                    name: post.heading,
                    thumbnail: creator.profileUrl ?? "https://app.wadzzo.com/images/loading.png",
                  },
                  assetId: 1,
                  createdAt: new Date(),
                  id: 1,
                  price: 0,
                  priceUSD: 0,

                })
                setCurrentAudioPlayingId(item.id);
              }
            }}
          >
            {
              currentAudioPlayingId === item.id ? (
                <PostAudioPlayer />
              ) : (
                <DummyAudioPostPlayer audioId={item.id}
                  name={post.heading}
                  artist={creatorId}
                  creatorProfileUrl={creatorProfileUrl}
                  mediaUrl={item.url}
                />
              )
            }
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
        <div className="ml-4 flex flex-col w-full">
          <div className="items-center flex flex-row justify-between w-full">
            <Link
              href={creatorProfileUrl}
              className="text-sm font-semibold text-gray-600 hover:underline"
            >
              {creator.name}
            </Link>
            <PostContextMenu creatorId={creator.id} postId={post.id} />
          </div>
          <div className="flex items-center text-xs text-blue-700">
            {priority && (
              <Badge variant="secondary" className={`mr-2 ${getBadgeStyle(priority)}`}>
                {priority}
              </Badge>
            )}
            {formatPostCreatedAt(post.createdAt)}
          </div>
        </div>

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
                {media[currentMediaIndex] ? renderMediaItem(media[currentMediaIndex], post.creatorId) : null}
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
        show && (
          <div className="px-4 pb-4">
            <AddComment postId={post.id} />
          </div>
        )
      }
      {showCommentBox && comments.data && comments.data.length > 0 && (
        <div className="mt-1 flex flex-col  border-2 border-base-200">
          <div className=" flex flex-col   px-4 py-2">
            {comments.data?.map((comment) => (
              <>
                <CommentView
                  key={comment.id}
                  comment={comment}
                  childrenComments={comment.childComments}
                />
                <Separator className="m-2" />
              </>
            ))}
          </div>
          {
            commentCount > 5 && (
              <div className="flex justify-center items-center p-2">
                <Link href={postUrl}>

                  See More
                </Link>
              </div>
            )
          }
        </div>
      )}
    </Card >
  );
}

