import { Asset, Horizon } from "@stellar/stellar-sdk";
import { z } from "zod";
import { tradeFormSchema } from "~/components/marketplace/trade/create-trade";
import { STELLAR_URL } from "~/lib/stellar/constant";
import { tradeAssetXDR } from "~/lib/stellar/marketplace/trx/trade";
import { SignUser } from "~/lib/stellar/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const tradeRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getTradeXDR: protectedProcedure
    .input(tradeFormSchema.extend({ signWith: SignUser }))
    .mutation(async ({ ctx, input }) => {
      // validate
      const { selling, buying, amount, price } = input;
      const sellingAsset = assetFromInput(selling);
      const buyingAsset = assetFromInput(buying);

      // const creator = await ctx.db.creator.findUniqueOrThrow({
      //   where: { id: ctx.session.user.id },
      // });

      return await tradeAssetXDR({
        amount: amount.toString(),
        buyingAsset,
        price: amount.toString(),
        sellingAsset,
        creatorStorageSecret: "creator.storageSecret",
        pubkey: ctx.session.user.id,
        signWith: input.signWith,
      });
    }),

  getOffers: protectedProcedure.query(async ({ ctx, input }) => {
    const id = ctx.session.user.id;
    const server = new Horizon.Server(STELLAR_URL);
    const offers = await server.offers().forAccount(id).call();

    return offers;
  }),
});

function assetFromInput(input: string) {
  const [code, issuer] = input.split("-");
  if (!code || !issuer) {
    throw new Error("Invalid asset input");
  }
  return new Asset(code, issuer);
}
