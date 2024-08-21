import { formatPostCreatedAt } from "~/utils/format-date";
import Avater from "../../ui/avater";
import { Comment } from "@prisma/client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ContextMenu from "../../ui/context-menu";
import { api } from "~/utils/api";
import Image from "next/image";
import { Button } from "~/components/shadcn/ui/button";
import { AddReplyComment } from "./add-reply";
import ReplyCommentView from "./reply";

export default function CommentView({
  comment,
  childrenComments,
}: {
  comment: Comment & {
    user: {
      name: string | null;
      image: string | null;
    };
  };
  childrenComments: ({
    user: {
      name: string | null;
      image: string | null;
    };
  } & Comment)[];
}) {
  const [replyBox, setReplyBox] = useState<boolean>(false);

  return (
    <div className="flex h-full w-full items-start justify-between text-sm ">
      <div className="flex w-full gap-2">
        <div className="h-auto w-auto rounded-full">
          <Avater className="h-12 w-12" url={comment.user.image} />
        </div>
        <div className="flex w-full flex-col items-start">
          <h2 className="font-bold">{comment.user.name}</h2>
          {/* <p>{comment.content}</p> */}
          {comment.content.length > 50 ? (
            <ShowMore content={comment.content} />
          ) : (
            <p>{comment.content}</p>
          )}

          <p className="text-gray-400">
            {formatPostCreatedAt(comment.createdAt)}
          </p>

          <div className="w-full">
            <Button
              onClick={() => setReplyBox((prev) => !prev)}
              variant="link"
              className="m-0 p-0"
            >
              Reply
            </Button>

            {replyBox && (
              <div className="w-full ">
                <AddReplyComment
                  parentId={comment.id}
                  postId={comment.postId}
                />
              </div>
            )}
          </div>

          <div className="mt-2 w-full">
            {childrenComments.length > 0 &&
              childrenComments.map((comment) => (
                <ReplyCommentView key={comment.id} comment={comment} />
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
