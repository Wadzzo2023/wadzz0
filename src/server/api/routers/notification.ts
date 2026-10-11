import type { NotificationType, Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/**
 * Fan-side events only. Brand-side ones (someone joined or entered your
 * bounty, liked or followed your brand) live in the brand portal's inbox; the
 * `isCreator` flag already separates them, and this list is a second guard.
 */
const FAN_TYPES: NotificationType[] = ["POST", "COMMENT", "REPLY", "BOUNTY", "BOUNTY_WINNER", "BOUNTY_COMMENT", "BOUNTY_REPLY", "BOUNTY_DOUBT_CREATE", "BOUNTY_DOUBT_REPLY"];

const POST_TYPES = new Set<NotificationType>(["POST", "COMMENT", "REPLY"]);

const mine = (userId: string): Prisma.NotificationWhereInput => ({
  notifierId: userId,
  isCreator: false,
  notificationObject: { entityType: { in: FAN_TYPES } },
});

/** My fan inbox (brand notifications live in the brand portal). */
export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20), cursor: z.number().int().nullish() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.notification.findMany({
        where: mine(ctx.session.user.id),
        select: {
          id: true,
          seen: true,
          createdAt: true,
          notificationObject: {
            select: {
              entityType: true,
              entityId: true,
              actor: { select: { id: true, name: true, image: true, creator: { select: { name: true, profileUrl: true } } } },
            },
          },
        },
        orderBy: { id: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
      });
      const page = rows.slice(0, input.limit);

      // What each notification is about: the post or bounty title.
      const postIds = page.filter((n) => POST_TYPES.has(n.notificationObject.entityType)).map((n) => n.notificationObject.entityId);
      const bountyIds = page.filter((n) => !POST_TYPES.has(n.notificationObject.entityType)).map((n) => n.notificationObject.entityId);
      const [posts, bounties] = await Promise.all([
        postIds.length ? ctx.db.post.findMany({ where: { id: { in: postIds } }, select: { id: true, heading: true } }) : [],
        bountyIds.length ? ctx.db.bounty.findMany({ where: { id: { in: bountyIds } }, select: { id: true, title: true } }) : [],
      ]);

      const items = page.map((n) => {
        const { entityType: type, entityId, actor } = n.notificationObject;
        const isPost = POST_TYPES.has(type);
        const title = isPost ? posts.find((p) => p.id === entityId)?.heading : bounties.find((b) => b.id === entityId)?.title;
        return {
          id: n.id,
          seen: Boolean(n.seen),
          createdAt: n.createdAt,
          type,
          entityId,
          title: title ?? null,
          // a brand acting shows its brand name and logo
          actor: { id: actor.id, name: actor.creator?.name ?? actor.name, image: actor.creator?.profileUrl ?? actor.image },
        };
      });
      return { items, nextCursor: rows.length > input.limit ? (items.at(-1)?.id ?? null) : null };
    }),

  unseenCount: protectedProcedure.query(({ ctx }) => ctx.db.notification.count({ where: { ...mine(ctx.session.user.id), seen: null } })),

  markAllSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({ where: { ...mine(ctx.session.user.id), seen: null }, data: { seen: new Date() } });
  }),
});
