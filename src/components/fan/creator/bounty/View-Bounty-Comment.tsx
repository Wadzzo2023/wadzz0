import { formatPostCreatedAt } from "~/utils/format-date";

import { useSession } from "next-auth/react";
import React, { useState } from "react";

import { api } from "~/utils/api";

import { BountyComment } from "@prisma/client";
import { Button } from "~/components/shadcn/ui/button";
import Avater from "~/components/ui/avater";
import ContextMenu from "~/components/ui/context-menu";
import { AddBountyReplyComment } from "./Add-Reply-Bounty-Comment";
import ViewReplyBountyComment from "./View-Reply-Bounty-Comment";

export default function ViewBountyComment({
  comment,
  bountyChildComments,
}: {
  comment: BountyComment & {
    userWinCount: number;
    user: {
      name: string | null;
      image: string | null;
    };
  };
  bountyChildComments: ({
    user: {
      name: string | null;
      image: string | null;
    };
  } & BountyComment)[];
}) {
  const [replyBox, setReplyBox] = useState<boolean>(false);

  return (
    <div className="flex items-start justify-between text-sm ">
      <div className="flex w-full gap-2">
        <div className="h-auto w-auto rounded-full">
          <Avater
            className="h-12 w-12"
            url={comment.user.image}
            winnerCount={comment.userWinCount}
          />
        </div>
        <div className="flex w-full flex-col items-start">
          <h2 className="font-bold">{comment.user.name}</h2>
          {/* <p>{comment.content}</p> */}
          {comment.content.length > 200 ? (
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
                <AddBountyReplyComment
                  parentId={comment.id}
                  bountyId={comment.bountyId}
                />
              </div>
            )}
          </div>

          <div className="mt-2 flex w-full flex-col gap-3">
            {bountyChildComments.length > 0 &&
              bountyChildComments.map((comment) => (
                <ViewReplyBountyComment key={comment.id} comment={comment} />
              ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <CommentContextMenu
          bountyCommentId={comment.id}
          commentatorId={comment.userId}
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
  commentatorId,
  bountyCommentId,
}: {
  commentatorId: string;
  bountyCommentId: number;
}) {
  const { data } = useSession();
  const deletePost = api.bounty.Bounty.deleteBountyComment.useMutation();

  const handleDelete = () => deletePost.mutate(bountyCommentId);

  if (data?.user && data.user.id === commentatorId) {
    return (
      <ContextMenu
        bg="bg-base-300"
        handleDelete={handleDelete}
        isLoading={deletePost.isLoading}
      />
    );
  }
}
