import { z } from "zod";
import {
  getAssetPrice,
  getPlatformAssetNumberForUSD,
  getPlatformTokenNumberForUSD,
} from "~/lib/stellar/fan/get_token_price";
import { sendSiteAsset2pub } from "~/lib/stellar/marketplace/trx/site_asset_recharge";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// calling the squire backedapi
const url = "https://next-actionverse.vercel.app/api/square";
process.env.NODE_ENV === "production"
  ? "https://next-actionverse.vercel.app/api/square"
  : "http://localhost:3000/api/square";

export const payRouter = createTRPCRouter({
  getRechargeXDR: protectedProcedure
    .input(z.object({ tokenNum: z.number(), xlm: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;
      if (user.email) {
        return await sendSiteAsset2pub(user.id, input.tokenNum);
      } else {
        throw new Error("Account does not have an associated email");
      }
    }),
  payment: protectedProcedure
    .input(
      z.object({
        sourceId: z.string().optional(),
        amount: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { amount: priceUSD, sourceId } = input;
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


      const { result } = await client.paymentsApi.createPayment({
        idempotencyKey: randomUUID(),
        sourceId: input.sourceId,
        amountMoney: {
          currency: "USD",
          amount: BigInt(priceUSD),
        },
      });
      */

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

  getOffers: protectedProcedure.query(async ({ ctx }) => {
    // const tokenNumber = await getPlatfromAssetPrice();
    const bandCoinPrice = await getAssetPrice();
    const offers = [4.99, 9.99, 19.99, 24.99, 49.99, 99.99].map((price) => {
      const num = price / bandCoinPrice;
      return {
        price,
        num,
      };
    });
    return offers;
  }),
});
