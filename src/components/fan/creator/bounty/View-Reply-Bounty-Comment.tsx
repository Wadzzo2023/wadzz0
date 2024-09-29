import { formatPostCreatedAt } from "~/utils/format-date";

import { useSession } from "next-auth/react";
import React from "react";

import { BountyComment } from "@prisma/client";
import Avater from "~/components/ui/avater";
import ContextMenu from "~/components/ui/context-menu";
import { api } from "~/utils/api";

export default function ViewReplyBountyComment({
  comment,
}: {
  comment: BountyComment & {
    user: {
      name: string | null;
      image: string | null;
    };
  };
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm ">
      <div className="flex w-full gap-2">
        <div className="h-auto w-auto rounded-full">
          <Avater className="h-12 w-12" url={comment.user.image} />
        </div>
        <div className="flex flex-col items-start">
          <div className="font-bold">{comment.user.name}</div>
          {/* <p>{comment.content}</p> */}
          {comment.content.length > 200 ? (
            <ShowMore content={comment.content} />
          ) : (
            <p>{comment.content}</p>
          )}

          <p className="">{formatPostCreatedAt(comment.createdAt)}</p>
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
