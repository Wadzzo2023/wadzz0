import { formatPostCreatedAt } from "~/utils/format-date";
import Avater from "../ui/avater";
import { Comment } from "@prisma/client";
import React from "react";
import { useSession } from "next-auth/react";
import ContextMenu from "../ui/context-menu";
import { api } from "~/utils/api";

export default function CommentView({
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
    <div className="flex justify-between border-b border-neutral">
      <div className="flex gap-2">
        <div>
          <Avater url={comment.user.image} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">{comment.user.name}</h2>
          {/* <p>{comment.content}</p> */}
          {comment.content.length > 50 ? (
            <ShowMore content={comment.content} />
          ) : (
            <p>{comment.content}</p>
          )}

          <p></p>
        </div>
      </div>
      <div className="flex gap-2">
        <p className=" text-right">{formatPostCreatedAt(comment.createdAt)}</p>

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
  const deletePost = api.post.deleteComment.useMutation();

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
