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
  console.log("REPLY COMMENT", comment);

  return (
    <div className="flex justify-between ">
      <div className="flex gap-2">
        <div className="h-auto w-auto rounded-full">
          <Image
            height={100}
            width={100}
            className="h-10 w-10 cursor-pointer rounded-full object-cover shadow"
            alt="User avatar"
            src={comment.user.image ?? "/images/icons/avatar-icon.png"}
          />
        </div>
        <div className="flex flex-col items-start">
          <Link href={`/fans/creator/${comment.userId}`} className="font-bold">
            {comment.user.name}
          </Link>
          {/* <p>{comment.content}</p> */}
          {comment.content.length > 50 ? (
            <ShowMore content={comment.content} />
          ) : (
            <p>{comment.content}</p>
          )}

          <p className="">{formatPostCreatedAt(comment.createdAt)}</p>
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
