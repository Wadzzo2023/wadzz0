import { AssetTxType, type Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { settleOpenFor } from "~/server/stellar/ledger";

/** My transaction history: purchases, sales, resale listings, claims, gifts. */
export const activityRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        role: z.enum(["all", "bought", "sold"]).default("all"),
        type: z.nativeEnum(AssetTxType).optional(),
        limit: z.number().int().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      // Settle anything left open (e.g. a tab closed right after signing) before listing.
      if (!input.cursor) await settleOpenFor(ctx.db, me);

      const mine: Prisma.AssetTransactionWhereInput =
        input.role === "bought" ? { buyerId: me } : input.role === "sold" ? { sellerId: me } : { OR: [{ buyerId: me }, { sellerId: me }] };
      const rows = await ctx.db.assetTransaction.findMany({
        where: { ...mine, ...(input.type && { type: input.type }), NOT: { status: "PENDING", txHash: null } },
        select: {
          id: true,
          type: true,
          status: true,
          method: true,
          currency: true,
          quantity: true,
          price: true,
          royaltyAmount: true,
          platformFee: true,
          networkFee: true,
          reserveCost: true,
          total: true,
          txHash: true,
          error: true,
          paymentRef: true,
          createdAt: true,
          buyerId: true,
          sellerId: true,
          asset: { select: { id: true, name: true, code: true, thumbnail: true } },
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
      });
      const items = rows.slice(0, input.limit);
      return { items, nextCursor: rows.length > input.limit ? (items.at(-1)?.id ?? null) : null };
    }),
});
