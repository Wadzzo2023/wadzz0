import { z } from "zod";
import { SignUser, WithSing } from "~/lib/stellar/utils";
import { buyAssetTrx } from "~/lib/stellar/fan/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/fan/clawback";
import { createAsset } from "~/lib/stellar/fan/create_asset";
import {
  getAssetNumberForXLM,
  getPlatfromAssetPrice,
} from "~/lib/stellar/fan/get_token_price";
import { getClawbackAsPayment } from "~/lib/stellar/fan/subscribe";
import { AssetSchema } from "~/lib/stellar/fan/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createStorageTrx } from "~/lib/stellar/fan/create_storage";
import { createUniAsset } from "~/lib/stellar/uni_create_asset";
import { db } from "~/server/db";
import { env } from "~/env";
import { Keypair } from "stellar-sdk";
import { copyToBalance } from "~/lib/stellar/marketplace/test/acc";

export const trxRouter = createTRPCRouter({
  clawbackAssetCreationTrx: protectedProcedure
    .input(z.object({ code: z.string(), signWith: SignUser }))
    .mutation(async ({ ctx, input }) => {
      const { code, signWith } = input;

      const creatorId = ctx.session.user.id;

      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: creatorId },
      });

      const creatorStorageSec = creator.storageSecret;

      return await clawBackAccCreate({
        storageSecret: creatorStorageSec,
        pubkey: creatorId,
        assetCode: code,
        signWith,
      });
    }),

  clawbackAssetPaymentTrx: protectedProcedure
    .input(
      AssetSchema.extend({
        creatorId: z.string(),
        price: z.number(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { signWith } = input;
      const price = input.price.toString();

      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: input.creatorId },
        select: { storageSecret: true },
      });
      const creatorStorageSec = creator.storageSecret;

      const xdr = await getClawbackAsPayment({
        signWith,
        creatorId: input.creatorId,
        creatorStorageSec,
        price: price,
        assetInfo: input,
        userPubkey: ctx.session.user.id,
      });

      return await WithSing({ xdr, signWith: input.signWith });
    }),

  createAssetTrx: protectedProcedure
    .input(
      z.object({ code: z.string(), limit: z.number(), signWith: SignUser }),
    )
    .mutation(async ({ ctx, input }) => {
      const assetAmout = await getAssetNumberForXLM();

      return await createAsset({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
        code: input.code,
        limit: input.limit,
        signWith: input.signWith,
      });
    }),

  createUniAssetTrx: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        limit: z.number(),
        signWith: SignUser,
        ipfsHash: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: i }) => {
      const assetAmout = await getAssetNumberForXLM();
      const signWith = i.signWith;
      const limit = copyToBalance(i.limit);

      // set this for admin and user
      let pubkey = ctx.session.user.id;
      let storageSecret: string;
      let homeDomain: string;

      if (signWith && "isAdmin" in signWith) {
        storageSecret = env.STORAGE_SECRET;
        homeDomain = "bandcoin.io";
        pubkey = Keypair.fromSecret(env.MOTHER_SECRET).publicKey();
      } else {
        const storage = await db.creator.findFirstOrThrow({
          where: { id: ctx.session.user.id },
          select: { storageSecret: true },
        });

        storageSecret = storage.storageSecret;
        homeDomain = "bandcoin.io";
      }

      // console.log("storageSecret", storageSecret);

      return await createUniAsset({
        actionAmount: assetAmout.toString(),
        pubkey,
        storageSecret,
        code: i.code,
        homeDomain,
        limit,
        signWith,
        ipfsHash: i.ipfsHash,
      });
    }),

  buyAssetTrx: protectedProcedure
    .input(
      AssetSchema.extend({
        signWith: SignUser,
        price: z.number(),
        creatorId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const price = input.price.toString();
      const customerPubkey = ctx.session.user.id; // is the custeomr

      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: input.creatorId },
        select: { storageSecret: true },
      });

      const xdr = await buyAssetTrx({
        customerPubkey,
        assetType: input,
        creatorId: input.creatorId,
        price: price,
        storageSecret: creator.storageSecret,
      });

      return await WithSing({ xdr, signWith: input.signWith });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getAssetPrice: publicProcedure.query(async () => {
    return await getPlatfromAssetPrice();
  }),

  getAssetNumberforXlm: publicProcedure
    .input(z.number().optional())
    .query(async ({ input }) => {
      return await getAssetNumberForXLM(input);
    }),

  createStorageAccount: protectedProcedure
    .input(SignUser)
    .mutation(async ({ ctx, input }) => {
      return await createStorageTrx({
        pubkey: ctx.session.user.id,
        signWith: input,
      });
    }),
});
