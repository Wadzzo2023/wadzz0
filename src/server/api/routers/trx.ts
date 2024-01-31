import { z } from "zod";
import { clawBackAccCreate } from "~/lib/stellar/clawback";

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
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
