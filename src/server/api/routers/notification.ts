import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as inbox from "~/server/notification-inbox";

const SCOPE = "fan" as const;
const ids = z.array(z.number().int()).min(1).max(200);

/**
 * My fan inbox. Brand-side events (someone bought, followed, joined your
 * bounty) live in the brand portal's inbox; the `isCreator` flag separates them.
 */
export const notificationRouter = createTRPCRouter({
  /** Newest first, repeats folded into one line. */
  list: protectedProcedure
    .input(z.object({ category: z.string().optional(), unreadOnly: z.boolean().default(false), limit: z.number().int().min(1).max(50).default(20), cursor: z.number().int().nullish() }))
    .query(({ ctx, input }) => inbox.listInbox(ctx.db, ctx.session.user.id, { scope: SCOPE, ...input })),

  unseenCount: protectedProcedure.query(({ ctx }) => inbox.unreadCount(ctx.db, ctx.session.user.id, SCOPE)),
  unreadByCategory: protectedProcedure.query(({ ctx }) => inbox.unreadByCategory(ctx.db, ctx.session.user.id, SCOPE)),

  markRead: protectedProcedure.input(z.object({ ids })).mutation(async ({ ctx, input }) => void (await inbox.markRead(ctx.db, ctx.session.user.id, input.ids))),
  markUnread: protectedProcedure.input(z.object({ ids })).mutation(async ({ ctx, input }) => void (await inbox.markUnread(ctx.db, ctx.session.user.id, input.ids))),
  markAllRead: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => void (await inbox.markAllRead(ctx.db, ctx.session.user.id, SCOPE, input?.category))),
  remove: protectedProcedure.input(z.object({ ids })).mutation(async ({ ctx, input }) => void (await inbox.remove(ctx.db, ctx.session.user.id, input.ids))),
  clearRead: protectedProcedure.mutation(async ({ ctx }) => void (await inbox.clearRead(ctx.db, ctx.session.user.id, SCOPE))),
});
