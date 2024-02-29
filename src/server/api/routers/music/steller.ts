import { z } from "zod";
import { STORAGE_PUB } from "~/lib/stellar/music/constant";
import {
  firstTransection,
  getAccBalance,
} from "~/lib/stellar/music/trx/create_song_token";
import { XDR4songBuy } from "~/lib/stellar/music/trx/payment_xdr";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { SignUser } from "~/lib/stellar/utils";

export const stellarRouter = createTRPCRouter({
  getPaymentXDR: publicProcedure
    .input(
      z.object({
        pubkey: z.string(),
        assetCode: z.string(),
        issuerPub: z.string(),
        limit: z.string(),
        price: z.string().refine(
          (v) => {
            const n = Number(v);
            return !isNaN(n) && v?.length > 0 && n > 0;
          },
          { message: "Invalid number" },
        ),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input }) => {
      const { limit, assetCode, issuerPub, pubkey, price, signWith } = input;

      return await XDR4songBuy({
        code: assetCode,
        issuerPub,
        userPub: pubkey,
        price,
        limit,
        signWith,
      });
    }),

  getMusicAssetXdr: protectedProcedure
    .input(
      z.object({
        signWith: SignUser,
        code: z.string(),
        limit: z.number(),
        ipfsHash: z.string(),
      }),
    )
    .mutation(async ({ input: i }) => {
      //validate input
      const assetLimit = i.limit.toString();

      return await firstTransection({
        assetCode: i.code,
        limit: assetLimit,
        signWith: i.signWith,
        ipfsHash: i.ipfsHash,
      });
    }),

  getStorageBalances: publicProcedure.query(() => {
    return getAccBalance(STORAGE_PUB);
  }),

  getAccBalances: publicProcedure
    .input(z.object({ pub: z.string().min(56) }))
    .query(({ input }) => {
      return getAccBalance(input.pub);
    }),
});
