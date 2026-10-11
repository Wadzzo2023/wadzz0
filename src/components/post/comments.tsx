"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Reply, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { Avatar } from "~/ui/person";
import { api } from "~/utils/api";

/** Comments under a post, with one level of replies. Anyone can read; commenting needs sign-in. */
export function Comments({ postId }: { postId: number }) {
  const { session } = useRequireAuth();
  const comments = api.post.comments.useQuery({ postId });
  const remove = api.post.deleteComment.useMutation({ onSuccess: () => comments.refetch() });
  const [replyTo, setReplyTo] = useState<number | null>(null);

  return (
    <section id="comments" className="scroll-mt-24 space-y-4">
      <h2 className="flex items-center gap-2 font-hud text-lg font-bold">
        <MessageCircle className="size-5 text-primary" /> Comments {comments.data && <span className="text-muted-foreground">({comments.data.length})</span>}
      </h2>
      <CommentForm postId={postId} onDone={() => void comments.refetch()} />
      <ul className="space-y-3">
        {comments.data?.map((c) => (
          <li key={c.id} className="glass space-y-3 rounded-xl p-3.5">
            <CommentRow c={c} mine={c.userId === session?.user.id} onDelete={() => remove.mutate({ id: c.id })} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} />
            {c.childComments.length > 0 && (
              <ul className="space-y-3 border-l border-foreground/10 pl-4">
                {c.childComments.map((r) => (
                  <li key={r.id}>
                    <CommentRow c={r} mine={r.userId === session?.user.id} onDelete={() => remove.mutate({ id: r.id })} />
                  </li>
                ))}
              </ul>
            )}
            {replyTo === c.id && <CommentForm postId={postId} parentId={c.id} onDone={() => (setReplyTo(null), void comments.refetch())} compact />}
          </li>
        ))}
      </ul>
    </section>
  );
}

type Row = { id: number; content: string; createdAt: Date; user: { name: string | null; image: string | null } };

function CommentRow({ c, mine, onDelete, onReply }: { c: Row; mine: boolean; onDelete: () => void; onReply?: () => void }) {
  return (
    <div className="flex gap-3">
      <Avatar src={c.user.image} name={c.user.name} className="size-8 text-xs" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{c.user.name ?? "Fan"}</span>{" "}
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
        </p>
        <p className="whitespace-pre-line break-words text-sm text-foreground/90">{c.content}</p>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          {onReply && (
            <button type="button" onClick={onReply} className="inline-flex items-center gap-1 hover:text-foreground">
              <Reply className="size-3.5" /> Reply
            </button>
          )}
          {mine && (
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 hover:text-destructive">
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentForm({ postId, parentId, onDone, compact = false }: { postId: number; parentId?: number; onDone: () => void; compact?: boolean }) {
  const { requireAuth, signedIn } = useRequireAuth();
  const [text, setText] = useState("");
  const add = api.post.comment.useMutation({ onSuccess: () => (setText(""), onDone()) });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    requireAuth(() => {
      if (text.trim()) add.mutate({ postId, content: text.trim(), parentId });
    })();
  };
  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={signedIn ? (parentId ? "Write a reply…" : "Add a comment…") : "Sign in to comment"}
        rows={compact ? 1 : 2}
        maxLength={2000}
        className="min-h-0 resize-none rounded-xl"
      />
      <Button type="submit" disabled={add.isPending || (signedIn && !text.trim())} className="rounded-xl">
        {signedIn ? "Post" : "Sign in"}
      </Button>
    </form>
  );
}
