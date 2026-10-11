import type { NotificationType, Prisma } from "@prisma/client";

import { BOUNTY_TYPES, CATEGORIES, GROUPABLE, POST_TYPES, scopeTypes, type InboxScope } from "~/lib/notification-catalog";
import type { Db } from "~/server/db";

export type InboxActor = { id: string; name: string | null; image: string | null };

/** One line in the inbox: a notification, or several of the same kind on the same thing that day. */
export type InboxItem = {
  /** the underlying notification ids (mark read/unread/delete act on all of them) */
  ids: number[];
  type: NotificationType;
  entityId: number;
  count: number;
  unread: boolean;
  createdAt: Date;
  /** up to three, newest first; a brand shows by its brand name and logo */
  actors: InboxActor[];
  /** the post or bounty it's about */
  title: string | null;
  meta: Prisma.JsonValue | null;
};

/** Which rows of the user's notifications this inbox covers. */
function where(userId: string, scope: InboxScope, category?: string): Prisma.NotificationWhereInput {
  const types = category ? (CATEGORIES[scope].find((c) => c.id === category)?.types ?? []) : scopeTypes(scope);
  return { notifierId: userId, isCreator: scope === "brand", notificationObject: { entityType: { in: types } } };
}

const day = (d: Date) => d.toISOString().slice(0, 10);

export async function listInbox(
  db: Db,
  userId: string,
  { scope, category, unreadOnly, limit, cursor }: { scope: InboxScope; category?: string; unreadOnly?: boolean; limit: number; cursor?: number | null },
) {
  // Read more rows than lines wanted: repeats fold together, so a page of rows is fewer lines.
  const raw = Math.min(150, limit * 3);
  const rows = await db.notification.findMany({
    where: { ...where(userId, scope, category), ...(unreadOnly && { seen: null }) },
    select: {
      id: true,
      seen: true,
      createdAt: true,
      notificationObject: {
        select: {
          entityType: true,
          entityId: true,
          meta: true,
          actor: { select: { id: true, name: true, image: true, creator: { select: { name: true, profileUrl: true } } } },
        },
      },
    },
    orderBy: { id: "desc" },
    take: raw + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });
  const page = rows.slice(0, raw);
  const more = rows.length > raw;

  // Collapse repeats (same kind, same thing, same day) into one line.
  const items: InboxItem[] = [];
  const byKey = new Map<string, InboxItem>();
  for (const n of page) {
    const { entityType: type, entityId, meta, actor } = n.notificationObject;
    const who: InboxActor = { id: actor.id, name: actor.creator?.name ?? actor.name, image: actor.creator?.profileUrl ?? actor.image };
    const key = GROUPABLE.has(type) ? `${type}:${type === "FOLLOW" ? "*" : entityId}:${day(n.createdAt)}` : null;
    const existing = key ? byKey.get(key) : undefined;
    if (existing) {
      existing.ids.push(n.id);
      existing.count += 1;
      existing.unread ||= !n.seen;
      if (existing.actors.length < 3 && !existing.actors.some((a) => a.id === who.id)) existing.actors.push(who);
      continue;
    }
    const item: InboxItem = { ids: [n.id], type, entityId, count: 1, unread: !n.seen, createdAt: n.createdAt, actors: [who], title: null, meta };
    items.push(item);
    if (key) byKey.set(key, item);
  }

  // What each one is about: the post's heading or the bounty's title.
  const postIds = [...new Set(items.filter((i) => POST_TYPES.has(i.type)).map((i) => i.entityId))];
  const bountyIds = [...new Set(items.filter((i) => BOUNTY_TYPES.has(i.type)).map((i) => i.entityId))];
  const [posts, bounties] = await Promise.all([
    postIds.length ? db.post.findMany({ where: { id: { in: postIds } }, select: { id: true, heading: true } }) : [],
    bountyIds.length ? db.bounty.findMany({ where: { id: { in: bountyIds } }, select: { id: true, title: true } }) : [],
  ]);
  for (const i of items) {
    if (POST_TYPES.has(i.type)) i.title = posts.find((p) => p.id === i.entityId)?.heading ?? null;
    else if (BOUNTY_TYPES.has(i.type)) i.title = bounties.find((b) => b.id === i.entityId)?.title ?? null;
  }

  return { items, nextCursor: more ? (page.at(-1)?.id ?? null) : null };
}

export const unreadCount = (db: Db, userId: string, scope: InboxScope) => db.notification.count({ where: { ...where(userId, scope), seen: null } });

/** Per-category unread counts for the tabs. */
export async function unreadByCategory(db: Db, userId: string, scope: InboxScope) {
  const counts = await Promise.all(CATEGORIES[scope].map((c) => db.notification.count({ where: { ...where(userId, scope, c.id), seen: null } })));
  return Object.fromEntries(CATEGORIES[scope].map((c, i) => [c.id, counts[i] ?? 0]));
}

export const markRead = (db: Db, userId: string, ids: number[]) => db.notification.updateMany({ where: { id: { in: ids }, notifierId: userId, seen: null }, data: { seen: new Date() } });
export const markUnread = (db: Db, userId: string, ids: number[]) => db.notification.updateMany({ where: { id: { in: ids }, notifierId: userId }, data: { seen: null } });
export const markAllRead = (db: Db, userId: string, scope: InboxScope, category?: string) =>
  db.notification.updateMany({ where: { ...where(userId, scope, category), seen: null }, data: { seen: new Date() } });
export const remove = (db: Db, userId: string, ids: number[]) => db.notification.deleteMany({ where: { id: { in: ids }, notifierId: userId } });
export const clearRead = (db: Db, userId: string, scope: InboxScope) => db.notification.deleteMany({ where: { ...where(userId, scope), seen: { not: null } } });
