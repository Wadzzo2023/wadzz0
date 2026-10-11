"use client";

import type { NotificationType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, MessageCircle, MessagesSquare, Newspaper, Reply, Target, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { SignedIn } from "~/components/shell/sign-in-prompt";
import { Button } from "~/components/shadcn/ui/button";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { PageBody } from "~/ui/page-header";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

type Item = RouterOutputs["notification"]["list"]["items"][number];

/** How each fan notification reads, where it goes, and its icon. */
type Kind = { icon: LucideIcon; tone: string; text: (n: Item) => React.ReactNode; href: (n: Item) => string };
const KIND: Partial<Record<NotificationType, Kind>> = {
  POST: { icon: Newspaper, tone: "tone-info", text: (n) => <><b>{n.actor.name}</b> published a new post</>, href: (n) => `/posts/${n.entityId}` },
  COMMENT: { icon: MessageCircle, tone: "tone-neutral", text: (n) => <><b>{n.actor.name}</b> commented on a post you follow</>, href: (n) => `/posts/${n.entityId}#comments` },
  REPLY: { icon: Reply, tone: "tone-neutral", text: (n) => <><b>{n.actor.name}</b> replied in a conversation you&apos;re in</>, href: (n) => `/posts/${n.entityId}#comments` },
  BOUNTY: { icon: Target, tone: "tone-success", text: (n) => <><b>{n.actor.name}</b> posted a new bounty</>, href: (n) => `/bounties/${n.entityId}` },
  BOUNTY_WINNER: { icon: Trophy, tone: "tone-warning", text: () => <><b>You won!</b> The reward was sent to your wallet</>, href: (n) => `/bounties/${n.entityId}` },
  BOUNTY_COMMENT: { icon: MessageCircle, tone: "tone-neutral", text: (n) => <><b>{n.actor.name}</b> joined the discussion on a bounty</>, href: (n) => `/bounties/${n.entityId}?section=discussion` },
  BOUNTY_REPLY: { icon: Reply, tone: "tone-neutral", text: (n) => <><b>{n.actor.name}</b> replied to you in a bounty discussion</>, href: (n) => `/bounties/${n.entityId}?section=discussion` },
  BOUNTY_DOUBT_CREATE: { icon: MessagesSquare, tone: "tone-info", text: (n) => <><b>{n.actor.name}</b> sent you a message about a bounty</>, href: (n) => `/bounties/${n.entityId}?section=chat` },
  BOUNTY_DOUBT_REPLY: { icon: MessagesSquare, tone: "tone-info", text: (n) => <><b>{n.actor.name}</b> replied to your question</>, href: (n) => `/bounties/${n.entityId}?section=chat` },
};

export function NotificationsPage() {
  return (
    <SignedIn icon={Bell} title="Notifications" description="Sign in to see new posts, bounties and replies from the brands you follow.">
      <NotificationsView />
    </SignedIn>
  );
}

/** My inbox: new items on top, everything older below. Opening the page marks them read. */
function NotificationsView() {
  const q = api.notification.list.useInfiniteQuery({ limit: 20 }, { getNextPageParam: (p) => p.nextCursor });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const utils = api.useUtils();
  const markAll = api.notification.markAllSeen.useMutation({ onSuccess: () => void utils.notification.unseenCount.invalidate() });

  // Mark read once, shortly after the first page shows. Rows keep their "new"
  // highlight until the next visit (we don't refetch the list).
  const marked = useRef(false);
  const hasUnseen = items.some((n) => !n.seen);
  const { mutate: markAllSeen } = markAll; // stable across renders
  useEffect(() => {
    if (marked.current || !hasUnseen) return;
    const t = setTimeout(() => {
      marked.current = true;
      markAllSeen();
    }, 1500);
    return () => clearTimeout(t);
  }, [hasUnseen, markAllSeen]);

  const fresh = items.filter((n) => !n.seen);
  const earlier = items.filter((n) => n.seen);

  return (
    <PageBody className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-hud text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="text-sm text-muted-foreground">New posts, bounties and replies from the brands you follow.</p>
        </div>
        {hasUnseen && (
          <Button variant="outline" size="sm" className="glass shrink-0 rounded-xl" disabled={markAll.isPending || markAll.isSuccess} onClick={() => markAll.mutate()}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {q.isLoading ? (
        <div className="glass space-y-2 rounded-2xl p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState icon={Bell} title="You're all caught up" description="Follow brands to hear about their new posts and bounties." action={<Button asChild className="rounded-xl"><Link href="/creators">Find creators</Link></Button>} />
      ) : (
        <>
          {fresh.length > 0 && <Group title="New" items={fresh} />}
          {earlier.length > 0 && <Group title={fresh.length ? "Earlier" : "All"} items={earlier} />}
          {q.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" className="rounded-xl" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </PageBody>
  );
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="space-y-2">
      <h2 className="label-caps">{title}</h2>
      <ul className="glass divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl">
        {items.map((n) => (
          <Row key={n.id} n={n} />
        ))}
      </ul>
    </section>
  );
}

function Row({ n }: { n: Item }) {
  const kind = KIND[n.type];
  if (!kind) return null;
  return (
    <li>
      <Link href={kind.href(n)} className={cn("flex items-start gap-3 p-3.5 transition-colors hover:bg-foreground/[0.04]", !n.seen && "bg-primary/[0.06]")}>
        <span className="relative shrink-0">
          <Avatar src={n.actor.image} name={n.actor.name} className="size-11" />
          <span className={cn("absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-background", kind.tone)}>
            <kind.icon className="size-3" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug [&_b]:font-semibold">{kind.text(n)}</span>
          {n.title && <span className="mt-0.5 block truncate text-sm text-muted-foreground">“{n.title}”</span>}
          <span className="mt-1 block text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
        </span>
        {!n.seen && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]" aria-label="Unread" />}
      </Link>
    </li>
  );
}
