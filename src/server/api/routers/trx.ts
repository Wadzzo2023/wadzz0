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
    .input(AssetSchema)
    .mutation(async ({ input, ctx }) => {
      return await getClawbackAsPayment({
        assetInfo: input,
        userPubkey: ctx.session.user.id,
      });
    }),

  createAssetTrx: protectedProcedure.mutation(async ({ ctx }) => {
    return await createAsset({ pubkey: ctx.session.user.id, code: "VNDT" });
  }),

  buyAssetTrx: protectedProcedure
    .input(AssetSchema)
    .query(async ({ input, ctx }) => {
      const customerPubkey = ctx.session.user.id; // is the custeomr
      return await buyAssetTrx({ customerPubkey, assetType: input });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
