import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { settle } from "~/server/stellar/ledger";

/** Any transaction the server prepared: after the wallet submitted it, settle it from Horizon. */
export const txRouter = createTRPCRouter({
  confirm: protectedProcedure.input(z.object({ txId: z.string() })).mutation(async ({ ctx, input }) => {
    const row = await ctx.db.assetTransaction.findUnique({ where: { id: input.txId }, select: { buyerId: true, sellerId: true } });
    const me = ctx.session.user.id;
    if (!row || (row.buyerId !== me && row.sellerId !== me)) return null;
    const settled = await settle(ctx.db, input.txId);
    return settled && { status: settled.status, error: settled.error };
  }),
});
