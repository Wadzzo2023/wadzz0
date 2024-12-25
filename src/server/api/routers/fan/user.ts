import { Horizon } from "@stellar/stellar-sdk";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { z } from "zod";
import { UserAboutShema } from "~/components/fan/me/user-profile";
import { STELLAR_URL } from "~/lib/stellar/constant";
import { claimRedeemXDR } from "~/lib/stellar/fan/redeem";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import { SignUser } from "~/lib/stellar/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
  }),

  getUserById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input } });
      return user;
    }),
  updateUserProfile: protectedProcedure
    .input(UserAboutShema)
    .mutation(async ({ ctx, input }) => {
      const { name, bio } = input;
      await ctx.db.user.update({
        data: { name, bio },
        where: { id: ctx.session.user.id },
      });
    }),

  changeUserProfilePicture: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        data: { image: input },
        where: { id: ctx.session.user.id },
      });
    }),

  claimReward: protectedProcedure
    .input(
      z.object({
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const redeemCode = input.code;
      const updateRedeem = await ctx.db.redeem.update({
        where: { code: redeemCode },
        data: {
          redeemConsumers: {
            create: {
              userId: ctx.session.user.id,
            },
          },
        },
      });
      return updateRedeem;
    }),

  getClaimRewardXDR: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const redeemCode = input.code;
      const user = ctx.session.user.id;

      const getRedeem = await ctx.db.redeem.findUnique({
        where: { code: redeemCode.toLocaleUpperCase() },
        select: {
          _count: {
            select: {
              redeemConsumers: true,
            },
          },
          totalRedeemable: true,
          assetRedeem: {
            select: {
              code: true,
              issuer: true,
              creatorId: true,
              limit: true,
            },
          },
          redeemConsumers: {
            where: {
              userId: user,
            },
          },
        },
      });

      if (!getRedeem) {
        throw new Error("Invalid redeem code");
      }

      if (getRedeem.assetRedeem.creatorId === user) {
        throw new Error("You can't claim your own reward");
      }

      if (
        getRedeem.redeemConsumers.find((consumer) => consumer.userId === user)
      ) {
        throw new Error("You have already claimed this reward");
      }

      if (getRedeem._count.redeemConsumers >= getRedeem.totalRedeemable) {
        throw new Error("Redeem code limit exceeded");
      }

      if (!getRedeem.assetRedeem.creatorId) {
        throw new Error("Creator does not exist");
      }

      const getStorageAcc = await ctx.db.creator.findUnique({
        where: {
          id: getRedeem.assetRedeem.creatorId,
        },
        select: {
          storagePub: true,
          storageSecret: true,
        },
      });

      if (!getStorageAcc) {
        throw new Error("Creator does not have a storage account");
      }

      const stroageACC = await StellarAccount.create(getStorageAcc.storagePub);
      const tokenNumber = stroageACC.getTokenBalance(
        getRedeem.assetRedeem.code,
        getRedeem.assetRedeem.issuer,
      );

      if (tokenNumber < 1) {
        throw new Error("Insufficient token balance");
      }

      const UserAcc = await StellarAccount.create(user);
      const trust = UserAcc.hasTrustline(
        getRedeem.assetRedeem.code,
        getRedeem.assetRedeem.issuer,
      );

      if (!trust) {
        return claimRedeemXDR({
          userPub: user,
          creatorId: user,
          assetCode: getRedeem.assetRedeem.code,
          assetIssuer: getRedeem.assetRedeem.issuer,
          signWith: input.signWith,
          storageSecret: getStorageAcc.storageSecret,
        });
      } else {
        throw new Error("You have already has trust for this asset");
      }
    }),
  getClaimHistory: protectedProcedure.query(async ({ ctx }) => {
    const redeem = await ctx.db.redeem.findMany({
      where: {
        redeemConsumers: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
    });
    return redeem;
  }),
});
