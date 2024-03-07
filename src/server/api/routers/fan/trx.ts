import { getAccSecret } from "package/connect_wallet";
import { Asset } from "stellar-sdk";
import { z } from "zod";
import { SignUser, WithSing } from "~/lib/stellar/utils";
import { buyAssetTrx } from "~/lib/stellar/fan/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/fan/clawback";
import { createAsset } from "~/lib/stellar/fan/create_asset";
import {
  getAssetNumberForXLM,
  getBandcoinPrice,
  getPlatfromAssetPrice,
} from "~/lib/stellar/fan/get_token_price";
import { signXdrTransaction } from "~/lib/stellar/fan/signXDR";
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

export const trxRouter = createTRPCRouter({
  clawbackAssetCreationTrx: protectedProcedure
    .input(z.object({ code: z.string(), signWith: SignUser }))
    .mutation(async ({ ctx, input }) => {
      const { code, signWith } = input;
      const assetAmout = await getAssetNumberForXLM();

      return await clawBackAccCreate({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
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
      const price = input.price.toString();
      const xdr = await getClawbackAsPayment({
        creatorId: input.creatorId,
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
        admin: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input: i }) => {
      const assetAmout = await getAssetNumberForXLM();

      // get storage secret
      let storageSecret: string;
      let homeDomain: string;
      if (i.admin) {
        storageSecret = env.STORAGE_SECRET;
        homeDomain = "bandcoin.io";
      } else {
        const storage = await db.creator.findFirst({
          where: { id: ctx.session.user.id },
          select: { storageSecret: true },
        });
        if (!storage) throw new Error("No storage account found");
        storageSecret = storage.storageSecret;
        homeDomain = "fan.bandcoin.io";
      }

      return await createUniAsset({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
        storageSecret,
        code: i.code,
        homeDomain,
        limit: i.limit.toString(),
        signWith: i.signWith,
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
