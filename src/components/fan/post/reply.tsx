import { formatPostCreatedAt } from "~/utils/format-date";
import Avater from "../../ui/avater";
import { Comment } from "@prisma/client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ContextMenu from "../../ui/context-menu";
import { api } from "~/utils/api";
import Image from "next/image";
import { Button } from "~/components/shadcn/ui/button";
import Link from "next/link";
import { cn } from "~/lib/utils";

export default function ReplyCommentView({
  comment,
}: {
  comment: Comment & {
    user: {
      name: string | null;
      image: string | null;
    };
  };
}) {
  return (
    <div className="flex  w-full items-start justify-between text-sm ">
      <div className="flex w-full gap-2">
        <div className="h-auto w-auto rounded-full">
          <Avater className="h-12 w-12" url={comment.user.image} />
        </div>
        <div className="flex flex-col items-start">
          <Link href={`/fans/creator/${comment.userId}`} className="font-bold">
            {comment.user.name}
          </Link>
          <CommentFormatter content={comment.content} />

          <p className="text-gray-400">
            {formatPostCreatedAt(comment.createdAt)}
          </p>
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

function ShowMore({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  return (
    <>
      <p>{isExpanded ? content : content.slice(0, 50)}</p>
      {!isExpanded && (
        <button onClick={() => setIsExpanded(!isExpanded)}>See More</button>
      )}
    </>
  );
}
function CommentContextMenu({
  commentorId,
  commentId,
}: {
  commentorId: string;
  commentId: number;
}) {
  const { data } = useSession();
  const deletePost = api.fan.post.deleteComment.useMutation();

  const handleDelete = () => deletePost.mutate(commentId);

  if (data?.user && data.user.id === commentorId) {
    return (
      <ContextMenu
        bg="bg-base-300"
        handleDelete={handleDelete}
        isLoading={deletePost.isLoading}
      />
    );
  }
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


