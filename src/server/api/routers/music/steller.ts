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
import { copyToBalance } from "~/lib/stellar/marketplace/test/acc";

export const stellarRouter = createTRPCRouter({
  getPaymentXDR: publicProcedure
    .input(
      z.object({
        pubkey: z.string(),
        assetCode: z.string(),
        issuerPub: z.string(),
        limit: z.number(),
        price: z.number(),
        signWith: SignUser,
        creatorPub: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        limit: l,
        assetCode,
        issuerPub,
        pubkey,
        price,
        signWith,
        creatorPub,
      } = input;

      const creatorId = creatorPub;
      const storage = await ctx.db.creator.findUnique({
        where: { id: creatorId },
        select: { storageSecret: true },
      });
      if (!storage || !storage.storageSecret) {
        throw new Error("storage does not exist");
      }

      const limit = copyToBalance(l);

      return await XDR4songBuy({
        creatorPub: creatorId,
        storageSecret: storage.storageSecret,
        code: assetCode,
        issuerPub,
        userPub: pubkey,
        price: price.toString(),
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
