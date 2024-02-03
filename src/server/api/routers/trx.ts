import { Asset } from "stellar-sdk";
import { z } from "zod";
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
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
