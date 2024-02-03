import { Asset } from "stellar-sdk";
import { z } from "zod";
import { buyAssetTrx } from "~/lib/stellar/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/clawback";
import { createAsset } from "~/lib/stellar/create_asset";
import { getClawbackAsPayment } from "~/lib/stellar/subscribe";

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

  clawbackAssetPaymentTrx: protectedProcedure.mutation(async ({ ctx }) => {
    return await getClawbackAsPayment({
      asset: new Asset(
        "VNDT",
        "GD5LKBBNYRQLL2GXV7OC43KZAYVLNJT6NRI3HJTYQWXRLL7UPPMOVDVY",
      ),
      userPubkey: ctx.session.user.id,
    });
  }),

  createAssetTrx: protectedProcedure.mutation(async ({ ctx }) => {
    return await createAsset({ pubkey: ctx.session.user.id, code: "VNDT" });
  }),

  buyAssetTrx: protectedProcedure
    .input(
      z.object({ asset: z.object({ code: z.string(), issuer: z.string() }) }),
    )
    .query(async ({ input, ctx }) => {
      const { asset } = input;
      const customerPubkey = ctx.session.user.id; // is the custeomr
      return await buyAssetTrx({ customerPubkey, asset });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
