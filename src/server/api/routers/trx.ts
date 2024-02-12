import { Asset } from "stellar-sdk";
import { z } from "zod";
import { buyAssetTrx } from "~/lib/stellar/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/clawback";
import { createAsset } from "~/lib/stellar/create_asset";
import { getClawbackAsPayment } from "~/lib/stellar/subscribe";
import { AssetSchema } from "~/lib/stellar/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const trxRouter = createTRPCRouter({
  clawbackAssetCreationTrx: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await clawBackAccCreate({
        pubkey: ctx.session.user.id,
        assetCode: input.code,
      });
    }),

  clawbackAssetPaymentTrx: protectedProcedure
    .input(AssetSchema.extend({ creatorId: z.string(), price: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const price = input.price.toString();
      return await getClawbackAsPayment({
        creatorId: input.creatorId,
        price: price,
        assetInfo: input,
        userPubkey: ctx.session.user.id,
      });
    }),

  createAssetTrx: protectedProcedure
    .input(z.object({ code: z.string(), limit: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await createAsset({
        pubkey: ctx.session.user.id,
        code: input.code,
        limit: input.limit,
      });
    }),

  buyAssetTrx: protectedProcedure
    .input(AssetSchema.extend({ price: z.number(), creatorId: z.string() }))
    .query(async ({ input, ctx }) => {
      const price = input.price.toString();
      const customerPubkey = ctx.session.user.id; // is the custeomr
      return await buyAssetTrx({
        customerPubkey,
        assetType: input,
        creatorId: input.creatorId,
        price: price,
      });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
