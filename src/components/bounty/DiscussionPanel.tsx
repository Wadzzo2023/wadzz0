import { formatDistanceToNowStrict } from "date-fns";
import { CornerDownRight, Trash2 } from "lucide-react";
import { useState } from "react";

import { Skeleton } from "~/components/ar/Skeleton";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/utils/api";

type Comment = RouterOutputs["bounty"]["comments"][number];
type Reply = Comment["replies"][number];

const AVATAR_FALLBACK = "/brand/wadzzo-mark.png";

/**
 * ── DiscussionPanel ────────────────────────────────────────────────────────
 *
 * The public thread under a bounty: everyone who's looking at it, the brand
 * included. One level of replies, as in the reference. The composer is the
 * page's bottom bar; tapping "Reply" here just points it at a comment.
 */
export function DiscussionPanel({
  bountyId,
  onReply,
}: {
  bountyId: number;
  onReply: (target: { id: number; name: string }) => void;
}) {
  const comments = api.bounty.comments.useQuery({ bountyId });

  if (comments.isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading discussion">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (comments.isError) {
    return (
      <p className="rounded-ar border border-ar-danger/40 bg-ar-danger/10 px-3.5 py-2.5 text-[12px] text-ar-danger">
        Couldn&rsquo;t load the discussion.
      </p>
    );
  }
  if ((comments.data ?? []).length === 0) {
    return (
      <p className="py-10 text-center text-[12.5px] text-ar-faint">
        No comments yet. Start the conversation.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {(comments.data ?? []).map((c) => (
        <li key={c.id}>
          <CommentRow comment={c} bountyId={bountyId} />
          <div className="ml-10 mt-1.5">
            <button
              onClick={() => onReply({ id: c.id, name: c.author.name ?? "them" })}
              className="font-hud flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ar-faint hover:text-ar-text"
            >
              <CornerDownRight size={11} strokeWidth={2.5} />
              Reply
            </button>
            {c.replies.length > 0 && (
              <ol className="mt-2.5 space-y-3 border-l border-ar-line pl-3">
                {c.replies.map((r) => (
                  <li key={r.id}>
                    <CommentRow comment={r} bountyId={bountyId} small />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function CommentRow({
  comment,
  bountyId,
  small,
}: {
  comment: Comment | Reply;
  bountyId: number;
  small?: boolean;
}) {
  const utils = api.useUtils();
  const [confirming, setConfirming] = useState(false);
  const remove = api.bounty.deleteComment.useMutation({
    onSuccess: () => utils.bounty.comments.invalidate({ bountyId }),
  });

  return (
    <div className="flex gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={comment.author.image ?? AVATAR_FALLBACK}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", small ? "h-6 w-6" : "h-[30px] w-[30px]")}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate text-[12.5px] font-semibold text-ar-text">
            {comment.author.name ?? "Anonymous"}
          </span>
          <span className="font-hud shrink-0 text-[10px] text-ar-faint">
            {formatDistanceToNowStrict(new Date(comment.createdAt))}
          </span>
          {comment.mine && (
            <button
              onClick={() =>
                confirming ? remove.mutate({ commentId: comment.id }) : setConfirming(true)
              }
              onBlur={() => setConfirming(false)}
              disabled={remove.isPending}
              aria-label={confirming ? "Confirm delete" : "Delete comment"}
              className={cn(
                "font-hud ml-auto flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
                confirming ? "text-ar-danger" : "text-ar-faint hover:text-ar-text",
              )}
            >
              <Trash2 size={11} strokeWidth={2.4} />
              {confirming && "Delete?"}
            </button>
          )}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ar-dim">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
