"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Circle, CircleDot, Trash2 } from "lucide-react";
import Link from "next/link";

import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import type { InboxItem } from "~/server/notification-inbox";

import { describeFan } from "./describe";
import { useInboxActions } from "./use-inbox-actions";

/**
 * One line of the inbox. Opening it marks it read; the dot toggles read/unread
 * and the bin deletes it (both act on every notification folded into the line).
 */
export function NotificationRow({ item }: { item: InboxItem }) {
  const { markRead, markUnread, remove } = useInboxActions();
  const d = describeFan(item);
  const actor = item.actors[0];
  const ago = formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true });

  const body = (
    <>
      <span className="relative shrink-0">
        <Avatar src={actor?.image} name={actor?.name} className="size-11" />
        <span className={cn("absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-background", d.tone)}>
          <d.icon className="size-3" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug">{d.text}</span>
        {item.title && <span className="mt-0.5 block truncate text-sm text-muted-foreground">“{item.title}”</span>}
        <span className="mt-1 block text-xs text-muted-foreground">{ago}</span>
      </span>
    </>
  );
  const cls = "flex min-w-0 flex-1 items-start gap-3 py-3.5 pr-11";

  return (
    <li className={cn("group relative flex items-start gap-1 pl-1 transition-colors hover:bg-foreground/[0.04]", item.unread && "bg-primary/[0.06]")}>
      <button
        type="button"
        onClick={() => (item.unread ? markRead.mutate({ ids: item.ids }) : markUnread.mutate({ ids: item.ids }))}
        className="mt-[1.4rem] flex size-6 shrink-0 items-center justify-center rounded-full text-primary opacity-70 transition-opacity hover:opacity-100"
        aria-label={item.unread ? "Mark as read" : "Mark as unread"}
        title={item.unread ? "Mark as read" : "Mark as unread"}
      >
        {item.unread ? <CircleDot className="size-4" /> : <Circle className="size-3 text-muted-foreground/60" />}
      </button>
      {d.href ? (
        <Link href={d.href} onClick={() => item.unread && markRead.mutate({ ids: item.ids })} className={cls}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
      <button
        type="button"
        onClick={() => remove.mutate({ ids: item.ids })}
        className="absolute right-2 top-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-60"
        aria-label="Delete notification"
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
