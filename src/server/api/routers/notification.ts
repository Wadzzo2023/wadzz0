import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/** My fan inbox (brand notifications live in the brand portal). */
export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20), cursor: z.number().int().nullish() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.notification.findMany({
        where: { notifierId: ctx.session.user.id, isCreator: false },
        select: {
          id: true,
          seen: true,
          createdAt: true,
          notificationObject: { select: { entityType: true, entityId: true, actor: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { id: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
      });
      const items = rows.slice(0, input.limit);
      return { items, nextCursor: rows.length > input.limit ? (items.at(-1)?.id ?? null) : null };
    }),

  unseenCount: protectedProcedure.query(({ ctx }) =>
    ctx.db.notification.count({ where: { notifierId: ctx.session.user.id, isCreator: false, seen: null } }),
  ),

  markAllSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({ where: { notifierId: ctx.session.user.id, isCreator: false, seen: null }, data: { seen: new Date() } });
  }),
});
