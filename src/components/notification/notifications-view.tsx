"use client";

import { Bell, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { NotificationRow } from "~/components/notification/notification-row";
import { useInboxActions } from "~/components/notification/use-inbox-actions";
import { SignedIn } from "~/components/shell/sign-in-prompt";
import { Button } from "~/components/shadcn/ui/button";
import { CATEGORIES } from "~/lib/notification-catalog";
import { cn } from "~/lib/utils";
import type { InboxItem } from "~/server/notification-inbox";
import { EmptyState } from "~/ui/empty-state";
import { PageBody, PageHeader } from "~/ui/page-header";
import { Skeleton } from "~/ui/skeleton";
import { api } from "~/utils/api";

export function NotificationsPage() {
  return (
    <SignedIn icon={Bell} title="Notifications" description="Sign in to see new posts, bounties and replies from the brands you follow.">
      <NotificationsView />
    </SignedIn>
  );
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
function bucket(d: Date | string): "Today" | "Yesterday" | "Earlier" {
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(d))) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : "Earlier";
}

/** My inbox: newest first, repeats folded together; read, unread and delete per line. */
function NotificationsView() {
  const [category, setCategory] = useState<string | undefined>();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const q = api.notification.list.useInfiniteQuery({ category, unreadOnly, limit: 20 }, { getNextPageParam: (p) => p.nextCursor ?? undefined, refetchOnWindowFocus: true });
  const counts = api.notification.unreadByCategory.useQuery(undefined, { refetchOnWindowFocus: true });
  const { markAllRead, clearRead } = useInboxActions();

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const sections = useMemo(() => {
    const out: { label: string; rows: InboxItem[] }[] = [];
    for (const i of items) {
      const label = bucket(i.createdAt);
      const last = out.at(-1);
      if (last?.label === label) last.rows.push(i);
      else out.push({ label, rows: [i] });
    }
    return out;
  }, [items]);
  const totalUnread = Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0);

  return (
    <PageBody wide className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Posts and bounties from brands you follow, replies, and your purchases and gifts."
        actions={
          <>
            <Button variant="outline" size="sm" className="shrink-0" disabled={!totalUnread || markAllRead.isPending} onClick={() => markAllRead.mutate({ category })}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
            <Button variant="ghost" size="sm" className="shrink-0" disabled={clearRead.isPending} onClick={() => clearRead.mutate()}>
              <Trash2 className="size-4" /> Clear read
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Category">
          <Chip active={!category} onClick={() => setCategory(undefined)} label="All" count={totalUnread} />
          {CATEGORIES.fan.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} label={c.label} count={counts.data?.[c.id] ?? 0} />
          ))}
        </div>
        <div className="flex h-12 items-center gap-1 rounded-2xl bg-surface-2 p-1" role="tablist" aria-label="Show">
          {[
            { id: false, label: "All" },
            { id: true, label: "Unread" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="tab"
              aria-selected={unreadOnly === o.id}
              onClick={() => setUnreadOnly(o.id)}
              className={cn("flex h-10 items-center px-4 font-hud text-lg uppercase transition-colors", unreadOnly === o.id ? "blob bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="glass space-y-2 rounded-[1.4rem] p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "Nothing unread" : "You're all caught up"}
          description={unreadOnly ? "You've read everything." : "Follow brands to hear about their new posts and bounties."}
          action={!unreadOnly && <Button asChild><Link href="/creators">Find creators</Link></Button>}
        />
      ) : (
        <div className="space-y-5">
          {sections.map((s) => (
            <section key={s.label} className="space-y-2">
              <h2 className="marker -rotate-1 text-base text-muted-foreground">*{s.label.toLowerCase()}*</h2>
              <ul className="glass divide-y-2 divide-dashed divide-foreground/10 overflow-hidden rounded-[1.4rem]">
                {s.rows.map((i) => (
                  <NotificationRow key={i.ids[0]} item={i} />
                ))}
              </ul>
            </section>
          ))}
          {q.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </PageBody>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-4 font-hud text-base uppercase transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-foreground/12 text-muted-foreground hover:border-foreground hover:text-foreground",
      )}
    >
      {label}
      {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1 font-sans text-[10px] font-bold text-side-ink">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}
