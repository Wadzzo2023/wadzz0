import { z } from "zod";
import { buyAssetTrx } from "~/lib/stellar/fan/buy_asset";
import {
  creatorPageAccCreate,
  creatorPageAccCreateWithXLM,
} from "~/lib/stellar/fan/clawback";
import { createAsset } from "~/lib/stellar/fan/create_asset";
import {
  getPlatformAssetPrice,
  getplatformAssetNumberForXLM,
} from "~/lib/stellar/fan/get_token_price";
import { getClawbackAsPayment } from "~/lib/stellar/fan/subscribe";
import { AssetSchema } from "~/lib/stellar/fan/utils";
import { SignUser, WithSing } from "~/lib/stellar/utils";

import { Keypair } from "@stellar/stellar-sdk";
import { PaymentMethodEnum } from "~/components/music/modal/buy_modal";
import { env } from "~/env";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  TrxBaseFeeInPlatformAsset,
} from "~/lib/stellar/constant";
import {
  createStorageTrx,
  createStorageTrxWithXLM,
} from "~/lib/stellar/fan/create_storage";
import { follow_creator } from "~/lib/stellar/fan/follow_creator";
import { sendGift } from "~/lib/stellar/fan/send_gift";
import { trustCustomPageAsset } from "~/lib/stellar/fan/trust_custom_page_asset";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import {
  createUniAsset,
  createUniAssetWithXLM,
} from "~/lib/stellar/uni_create_asset";
import { FanGitFormSchema } from "~/pages/fans/creator/gift";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const trxRouter = createTRPCRouter({
  createCreatorPageAsset: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        signWith: SignUser,
        limit: z.number().nonnegative().min(1),
        ipfs: z.string(),
        method: PaymentMethodEnum.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { code, signWith, limit } = input;

      const creatorId = ctx.session.user.id;

      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: creatorId },
      });

      const creatorStorageSec = creator.storageSecret;

      if (input.method && input.method === "xlm") {
        return await creatorPageAccCreateWithXLM({
          ipfs: input.ipfs,
          limit: limit.toString(),
          storageSecret: creatorStorageSec,
          pubkey: creatorId,
          assetCode: code,
          signWith,
        });
      } else {
        return await creatorPageAccCreate({
          ipfs: input.ipfs,
          limit: limit.toString(),
          storageSecret: creatorStorageSec,
          pubkey: creatorId,
          assetCode: code,
          signWith,
        });
      }
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
      const assetAmout = await getplatformAssetNumberForXLM();

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
        native: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input: i }) => {
      const assetAmount = await getplatformAssetNumberForXLM();
      const signWith = i.signWith;
      const limit = i.limit.toString();

      // set this for admin and user
      let pubkey = ctx.session.user.id;
      let storageSecret: string;
      const homeDomain = env.NEXT_PUBLIC_HOME_DOMAIN;

      if (signWith && "isAdmin" in signWith) {
        storageSecret = env.STORAGE_SECRET;
        pubkey = Keypair.fromSecret(env.MOTHER_SECRET).publicKey();
      } else {
        const storage = await db.creator.findFirstOrThrow({
          where: { id: ctx.session.user.id },
          select: { storageSecret: true },
        });

        storageSecret = storage.storageSecret;
      }

      // console.log("storageSecret", storageSecret);

      if (i.native) {
        return await createUniAssetWithXLM({
          actionAmount: assetAmount.toString(),
          pubkey,
          storageSecret,
          code: i.code,
          homeDomain,
          limit,
          signWith,
          ipfsHash: i.ipfsHash,
        });
      } else {
        return await createUniAsset({
          actionAmount: assetAmount.toString(),
          pubkey,
          storageSecret,
          code: i.code,
          homeDomain,
          limit,
          signWith,
          ipfsHash: i.ipfsHash,
        });
      }
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
    return await getPlatformAssetPrice();
  }),

  getAssetNumberforXlm: publicProcedure
    .input(z.number().optional())
    .query(async ({ input }) => {
      return await getplatformAssetNumberForXLM(input);
    }),

  createStorageAccount: protectedProcedure
    .input(z.object({ signWith: SignUser, native: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (input.native) {
        return await createStorageTrxWithXLM({
          pubkey: ctx.session.user.id,
          signWith: input.signWith,
        });
      } else {
        return await createStorageTrx({
          pubkey: ctx.session.user.id,
          signWith: input.signWith,
        });
      }
    }),

  followCreatorTRX: protectedProcedure
    .input(z.object({ creatorId: z.string().min(56), signWith: SignUser }))
    .mutation(async ({ input, ctx }) => {
      const { creatorId, signWith } = input;
      const userId = ctx.session.user.id;

      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: creatorId },
        include: { pageAsset: true },
      });

      const userAcc = await StellarAccount.create(userId);

      if (creator.pageAsset) {
        const { code, issuer } = creator.pageAsset;

        const hasTrust = userAcc.hasTrustline(code, issuer);

        if (hasTrust) {
          return true;
        } else {
          // creat trust with userId
          const xdr = await follow_creator({
            creatorPageAsset: { code, issuer },
            userPubkey: userId,
            signWith,
          });
          return xdr;
        }
      } else {
        if (creator.customPageAssetCodeIssuer) {
          const [code, issuer] = creator.customPageAssetCodeIssuer.split("-");
          const issuerVal = z.string().length(56).safeParse(issuer);
          if (issuerVal.success && code) {
            const hasTrust = userAcc.hasTrustline(code, issuerVal.data);
            if (hasTrust) {
              return true;
            } else {
              const xdr = await follow_creator({
                creatorPageAsset: { code, issuer: issuerVal.data },
                userPubkey: userId,
                signWith,
              });
              return xdr;
            }
          } else {
            throw new Error("Issuer is invalid");
          }
        }
        throw new Error("creator has no page asset");
      }
    }),

  giftFollowerXDR: protectedProcedure // only logged creator can do that
    .input(FanGitFormSchema)
    .mutation(async ({ input, ctx }) => {
      const creatorId = ctx.session.user.id;
      const pubkey = input.pubkey;

      const isFollower = await ctx.db.follow.findUnique({
        where: {
          userId_creatorId: {
            creatorId: creatorId,
            userId: pubkey,
          },
        },
      });
      if (!isFollower) throw new Error("User is not a follower");

      const creator = await db.creator.findUniqueOrThrow({
        where: { id: creatorId },
        include: { pageAsset: true },
      });

      if (creator.pageAsset) {
        const { code, issuer } = creator.pageAsset;

        // send email
        const { storageSecret } = creator;

        return await sendGift({
          customerPubkey: pubkey,
          creatorPageAsset: { code, issuer },
          creatorStorageSec: storageSecret,
          creatorPub: creatorId,
          price: input.amount,
        });
      } else throw new Error("creator has no page asset");
    }),

  getRequiredPlatformAsset: publicProcedure
    .input(
      z.object({
        xlm: z.number(),
        platformAsset: z
          .number()
          .default(Number(PLATFORM_FEE) + Number(TrxBaseFeeInPlatformAsset)),
      }),
    )
    .query(async ({ ctx, input }) => {
      const token = await getplatformAssetNumberForXLM(input.xlm);
      return token + input.platformAsset;
    }),

  trustCustomPageAssetXDR: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        issuer: z.string(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { code, issuer, signWith } = input;

      const creator = await ctx.db.creator.findUniqueOrThrow({
        where: { id: ctx.session.user.id },
      });
      const requiredPlatformAsset = await getplatformAssetNumberForXLM(0.5);

      return await trustCustomPageAsset({
        signWith,
        code,
        issuer,
        creator: ctx.session.user.id,
        storageSecret: creator.storageSecret,
        requiredPlatformAsset: requiredPlatformAsset.toString(),
      });
    }),
});
