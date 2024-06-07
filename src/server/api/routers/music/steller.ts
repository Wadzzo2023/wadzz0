import { z } from "zod";
import {
  firstTransection,
  getAccBalance,
} from "~/lib/stellar/music/trx/create_song_token";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const stellarRouter = createTRPCRouter({
  //   getPaymentXDR: protectedProcedure
  //     .input(
  //       z.object({
  //         assetCode: z.string(),
  //         issuerPub: z.string(),
  //         limit: z.number(),
  //         signWith: SignUser,
  //       }),
  //     )
  //     .mutation(async ({ input, ctx }) => {
  //       const { limit: l, assetCode, issuerPub, signWith,  } = input;

  //       const pubkey = ctx.session.user.id; // customer pubkey

  // //asset: { code: assetCode, issuer: issuerPub }
  //       const dbAsset = await ctx.db.song.findUnique({
  //         where: { id: },
  //         select: {  price: true },
  //       });

  //       if (!dbAsset) throw new Error("asset not found");

  //         // admin
  //       const  creatorId = Keypair.fromSecret(env.MOTHER_SECRET).publicKey();
  //       const  storageSecret = env.STORAGE_SECRET;

  //       const limit = copyToBalance(l);

  //       return await XDR4BuyAsset({
  //         seller: creatorId,
  //         storageSecret,
  //         code: assetCode,
  //         issuerPub,
  //         buyer: pubkey,
  //         price: price.toString(),
  //         limit,
  //         signWith,
  //       });
  //     }),

  getMusicAssetXdr: protectedProcedure
    .input(
      z.object({
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
        ipfsHash: i.ipfsHash,
      });
    }),

  getAccBalances: publicProcedure
    .input(z.object({ pub: z.string().min(56) }))
    .query(({ input }) => {
      return getAccBalance(input.pub);
    }),
});
