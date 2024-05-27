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
  sendXLM_SiteAsset,
} from "~/lib/stellar/marketplace/trx/site_asset_recharge";
import log from "~/lib/logger/logger";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";

export const payRouter = createTRPCRouter({
  payment: protectedProcedure
    .input(
      z.object({
        sourceId: z.string().optional(),
        amount: z.number(),
        siteAssetAmount: z.number().int(),
        xlm: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.session.user;
      const pubkey = user.id;

      if (user.email) {
        const secret = await getAccSecretFromRubyApi(user.email);

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
            const { siteAssetAmount, xlm } = input;
            if (xlm) {
              // here trx will be send xlm
              // and create trustline
              // and send wadzoo
              return await sendXLM_SiteAsset({
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
      } else {
        throw new Error("Account has not email associate with it");
      }
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
