import { z } from "zod";
import { Client, Environment } from "square";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";
import { randomUUID } from "crypto";
import {
  sendSiteAsset2pub,
  sendXLM_Wadzzzo,
} from "~/lib/stellar/marketplace/trx/site_asset_recharge";
import log from "~/lib/logger/logger";

export const payRouter = createTRPCRouter({
  payment: publicProcedure
    .input(
      z.object({
        sourceId: z.string().optional(),
        amount: z.number(),
        siteAssetAmount: z.number().int(),
        pubkey: z.string(),
        secret: z.string(),
        xlm: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.sourceId) {
        const { paymentsApi } = new Client({
          accessToken: env.SQUARE_ACCESS_TOKEN,
          environment: env.SQUARE_ENVIRONMENT as Environment,
        });

        const { result } = await paymentsApi.createPayment({
          idempotencyKey: randomUUID(),
          sourceId: input.sourceId,
          amountMoney: {
            currency: "USD",
            amount: BigInt(input.amount),
          },
        });
        if (result.errors) {
          console.log("error happend", result.errors);
        }
        if (result.payment) {
          log.info("payment with square was sucessfull");
          // payment sucessfull
          // wadzoo should be transpered to the user.
          const { siteAssetAmount, pubkey, xlm, secret } = input;
          if (xlm) {
            // here trx will be send xlm
            // and create trustline
            // and send wadzoo
            return await sendXLM_Wadzzzo({
              siteAssetAmount,
              pubkey,
              xlm: xlm,
              secret: secret,
            });
          } else {
            return await sendSiteAsset2pub(pubkey, siteAssetAmount, secret);
          }
        }
      }
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
