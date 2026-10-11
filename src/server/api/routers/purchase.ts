import { z } from "zod";

import { BUY_METHODS, MAX_PER_PURCHASE } from "~/lib/stellar/quote";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { purchaseWithCard, resumeCardPurchase } from "~/server/stellar/card";
import { preparePurchase, quotePurchase } from "~/server/stellar/purchase";
import { signerFor } from "~/server/stellar/session-signer";

/**
 * Buying an item: quote (will it work, what it costs) → prepare (a transaction
 * to sign, holding the copy) → tx.confirm (checked on-chain). Card purchases are
 * charged first and delivered by the server.
 */
const quantity = z.number().int().min(1).max(MAX_PER_PURCHASE).default(1);

export const purchaseRouter = createTRPCRouter({
  quote: protectedProcedure
    .input(z.object({ listingId: z.number().int(), method: z.enum(BUY_METHODS), quantity }))
    .query(({ ctx, input }) => quotePurchase(ctx, ctx.session.user.id, input.listingId, input.method, input.quantity)),

  prepare: protectedProcedure
    .input(z.object({ listingId: z.number().int(), method: z.enum(["PLATFORM_ASSET", "XLM"]), quantity }))
    .mutation(({ ctx, input }) =>
      preparePurchase(ctx, { buyerId: ctx.session.user.id, listingId: input.listingId, method: input.method, quantity: input.quantity, signer: signerFor(ctx.session) }),
    ),

  payByCard: protectedProcedure
    .input(z.object({ listingId: z.number().int(), sourceId: z.string().min(1), verificationToken: z.string().optional(), quantity }))
    .mutation(({ ctx, input }) => purchaseWithCard(ctx, { buyerId: ctx.session.user.id, signer: signerFor(ctx.session), ...input })),

  resumeCard: protectedProcedure
    .input(z.object({ txId: z.string() }))
    .mutation(({ ctx, input }) => resumeCardPurchase(ctx, { txId: input.txId, buyerId: ctx.session.user.id, signer: signerFor(ctx.session) })),
});
