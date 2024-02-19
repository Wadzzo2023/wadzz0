import { Asset } from "stellar-sdk";
import { z } from "zod";
import { buyAssetTrx } from "~/lib/stellar/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/clawback";
import { createAsset } from "~/lib/stellar/create_asset";
import {
  getAssetNumberForXLM,
  getBandcoinPrice,
  getPlatfromAssetPrice,
} from "~/lib/stellar/get_token_price";
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
      const assetAmout = await getAssetNumberForXLM();
      console.log("assetAmout", assetAmout);

      return await clawBackAccCreate({
        actionAmount: assetAmout.toString(),
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
      const assetAmout = await getAssetNumberForXLM();

      return await createAsset({
        actionAmount: assetAmout.toString(),
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

  getAssetPrice: publicProcedure.query(async () => {
    return await getPlatfromAssetPrice();
  }),

  getAssetNumberforXlm: publicProcedure
    .input(z.number().optional())
    .query(async ({ input }) => {
      return await getAssetNumberForXLM(input);
    }),
});
