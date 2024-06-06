import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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

      /*
      if (user.email) {
        const secret = await getAccSecretFromRubyApi(user.email);

        const client = new Client({
          accessToken: env.SQUARE_ACCESS_TOKEN,
          environment: env.SQUARE_ENVIRONMENT as Environment,
        });
        if (input.sourceId) {
          const { result } = await client.paymentsApi.createPayment({
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


      */
      return false;
    }),

  buyAsset: protectedProcedure
    .input(
      z.object({
        sourceId: z.string(),
        assetId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.session.user;

      const asset = await ctx.db.marketAsset.findUniqueOrThrow({
        where: { id: input.assetId },
      });

      const priceUSD = asset.priceUSD;

      /*
      const client = new Client({
        accessToken: env.SQUARE_ACCESS_TOKEN,
        environment: env.SQUARE_ENVIRONMENT as Environment,
      });

      console.log(client, "...vong..");

      const { result } = await client.paymentsApi.createPayment({
        idempotencyKey: randomUUID(),
        sourceId: input.sourceId,
        amountMoney: {
          currency: "USD",
          amount: BigInt(priceUSD),
        },
      });
      */

      // calling the squire backedapi
      const url = "https://next-actionverse.vercel.app/api/square";
      process.env.NODE_ENV === "production"
        ? "https://next-actionverse.vercel.app/api/square"
        : "http://localhost:3000/api/square";

      const result = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId: input.sourceId,
          priceUSD: priceUSD,
        }),
      });

      if (result.ok) {
        const data = (await result.json()) as { id: string; status: string };

        if (data.status === "COMPLETED") {
          return true;
        } else {
          throw new Error("Payment was not successful");
        }
      }

      if (result.status === 400) {
        throw new Error("Something went wrong with the payment");
      }
    }),
});
