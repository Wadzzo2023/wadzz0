"use client"

import { formatPostCreatedAt } from "~/utils/format-date";
import Avatar from "../../ui/avater";
import { Comment } from "@prisma/client";
import React, { useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import { AddReplyComment } from "./add-reply";
import ReplyCommentView from "./reply";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import ContextMenu from "~/components/ui/context-menu";
import { cn } from "~/lib/utils";
import Link from "next/link";

interface CommentViewProps {
  comment: Comment & {
    user: {
      name: string | null;
      image: string | null;
    };
  };
  childrenComments: (Comment & {
    user: {
      name: string | null;
      image: string | null;
    };
  })[];
}

export default function CommentView({ comment, childrenComments }: CommentViewProps) {
  const [replyBox, setReplyBox] = useState(false);

  return (
    <div className="flex w-full items-start justify-between text-sm">
      <div className="flex w-full gap-2">
        <div className="h-auto w-auto rounded-full">
          <Avatar className="h-12 w-12" url={comment.user.image} />
        </div>
        <div className="flex w-full flex-col items-start">
          <Link href={`/fans/creator/${comment.userId}`} className="font-bold">
            {comment.user.name}
          </Link>
          <CommentFormatter content={comment.content} />
          <p className="text-gray-400">
            {formatPostCreatedAt(comment.createdAt)}
          </p>

          <div className="w-full">
            <Button
              onClick={() => setReplyBox((prev) => !prev)}
              variant="link"
              className="m-0 p-0 h-auto"
            >
              Reply
            </Button>

            {replyBox && (
              <div className="w-full">
                <AddReplyComment
                  parentId={comment.id}
                  postId={comment.postId}
                />
              </div>
            )}
          </div>

          <div className="mt-2 w-full">
            {childrenComments.map((childComment) => (
              <ReplyCommentView key={childComment.id} comment={childComment} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <CommentContextMenu
          commentId={comment.id}
          commentorId={comment.userId}
        />
      </div>
    </div>
  );
}

interface CommentContextMenuProps {
  commentorId: string;
  commentId: number;
}

export function CommentContextMenu({ commentorId, commentId }: CommentContextMenuProps) {
  const { data: session } = useSession();
  const deleteComment = api.fan.post.deleteComment.useMutation();

  const handleDelete = () => deleteComment.mutate(commentId);

  if (session?.user && session.user.id === commentorId) {
    return (
      <ContextMenu
        bg="bg-base-300"
        handleDelete={handleDelete}
        isLoading={deleteComment.isLoading}
      />
    );
  }

  return null;
}






interface CommentFormatterProps {
  content: string
  maxLength?: number
  className?: string
}

function formatLinks(text: string) {
  // URL pattern
  const urlPattern = /https?:\/\/[^\s]+/g

  return text.split(urlPattern).reduce((arr, part, i, parts) => {
    if (i < parts.length - 1) {
      const match = text.match(urlPattern)?.[i]
      arr.push(
        part,
        <a
          key={i}
          href={match}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {match}
        </a>
      )
    } else {
      arr.push(part)
    }
    return arr
  }, [] as (string | JSX.Element)[])
}



export function CommentFormatter({ content, maxLength = 250, className }: CommentFormatterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Process the content
  const lines = content.split('\n')
  const shouldTruncate = content.length > maxLength && !isExpanded
  const displayContent = shouldTruncate
    ? content.slice(0, maxLength) + '...'
    : content

  // Format links and mentions
  const formattedContent = formatLinks(displayContent)

  return (
    <div className={cn("space-y-1", className)}>
      <div className="whitespace-pre-line text-sm">
        {formattedContent}
      </div>
      {content.length > maxLength && (
        <Button
          variant="link"
          className="h-auto p-0 text-muted-foreground text-xs font-normal"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "See less" : "See more"}
        </Button>
      )}
    </div>
  )
}


