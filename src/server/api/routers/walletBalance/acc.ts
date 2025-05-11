import { sign } from "crypto";
import { add } from "date-fns";
import { z } from "zod";
import { SignUser } from "~/lib/stellar/utils";
import {
  AddAssetTrustLine,
  BalanceWithHomeDomain,
  AcceptClaimableBalance,
  NativeBalance,
  PendingAssetList,
  RecentTransactionHistory,
  SendAssets,
  DeclineClaimableBalance,
  CheckHasTrustLineOnPlatformAsset,
  PlatformAssetBalance,
} from "~/lib/stellar/walletBalance/acc";
import { User } from "firebase/auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { Input } from "~/components/shadcn/ui/input";
import { Horizon } from "@stellar/stellar-sdk";
import { ServerApi } from "@stellar/stellar-sdk/lib/horizon";
import { PLATFORM_ASSET, STELLAR_URL } from "~/lib/stellar/constant";

export const WBalanceRouter = createTRPCRouter({
  getWalletsBalance: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await BalanceWithHomeDomain({ userPub: userId });
  }),
  getGiftWithHomeBalance: protectedProcedure.input(z.object({

    limit: z.number().min(1).max(100).nullish().default(10),
    cursor: z.string().nullish(),
  })).query(async ({ input, ctx }) => {
    const { limit, cursor } = input
    const server = new Horizon.Server(STELLAR_URL);
    const homeDomain = (PLATFORM_ASSET.code.toLowerCase() === "wadzzo"
      ? "app.wadzzo.com"
      : "bandcoin.io")
    try {
      const claimableBalancesCall = server.claimableBalances()

      if (limit) {
        claimableBalancesCall.limit(limit)
      }
      if (cursor) {
        claimableBalancesCall.cursor(cursor)
      }
      console.log(ctx.session.user.id)
      const claimableBalances = await claimableBalancesCall
        .claimant(ctx.session.user.id)
        .call()
      const filteredBalances = await Promise.all(
        claimableBalances.records.map(async (balance) => {
          const asset = balance.asset;
          if (!asset) return false;

          try {
            if (asset.includes(":")) {
              const [code, issuer] = asset.split(":");
              if (!issuer) throw new Error("Issuer is undefined");

              const account = await server.loadAccount(issuer);
              console.log("account.home_domain", account.home_domain);

              return account.home_domain === homeDomain;
            }
            return false;
          } catch (error) {
            console.error("Error checking home_domain:", error);
            return false;
          }
        })
      );
      const validBalances = claimableBalances.records.filter((_, i) => filteredBalances[i]);

      return {
        balances: validBalances,
        nextCursor:
          claimableBalances.records.length > 0
            ? claimableBalances.records[claimableBalances.records.length - 1]?.paging_token
            : undefined,
      }
    } catch (error) {
      console.error("Error fetching claimable balances:", error)
      throw new Error("Failed to fetch claimable balances")
    }
  }
  ),

  getNativeBalance: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await NativeBalance({ userPub: userId });
  }),
  sendWalletAssets: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().min(1, {
          message: "Recipient Id is required.",
        }),
        amount: z.number().positive({
          message: "Amount must be greater than zero.",
        }),
        asset_code: z.string().min(1, {
          message: "Asset code is required.",
        }),
        asset_type: z.string().min(1, {
          message: "Asset type is required.",
        }),
        asset_issuer: z.string().min(1, {
          message: "Asset Issuer is required.",
        }),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;

      let secretKey;
      if (ctx.session.user.email && ctx.session.user.email.length > 0) {
        secretKey = await getAccSecretFromRubyApi(ctx.session.user.email);
      }
      return await SendAssets({
        userPubKey: userPubKey,
        recipientId: input.recipientId,
        amount: input.amount,
        asset_code: input.asset_code,
        asset_type: input.asset_type,
        asset_issuer: input.asset_issuer,
        signWith: input.signWith,
        secretKey: secretKey,
      });
    }),

  addTrustLine: protectedProcedure
    .input(
      z.object({
        // trustLimit: z.number().positive({
        //   message: "Trust Limit must be greater than zero.",
        // }),
        asset_code: z.string().min(1, {
          message: "Asset code is required.",
        }),

        asset_issuer: z.string().min(1, {
          message: "Asset Issuer is required.",
        }),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;
      let secretKey;
      if (ctx.session.user.email && ctx.session.user.email.length > 0) {
        secretKey = await getAccSecretFromRubyApi(ctx.session.user.email);
      }
      return await AddAssetTrustLine({
        userPubKey: userPubKey,
        asset_code: input.asset_code,
        asset_issuer: input.asset_issuer,
        signWith: input.signWith,
        secretKey: secretKey,
      });
    }),

  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish().default(10),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const result = await RecentTransactionHistory({ userPubKey: userId, input });
      return {
        items: result.items,
        nextCursor: result.nextCursor,
      };
    }),

  getPendingAssetList: protectedProcedure.query(async ({ ctx, input }) => {
    const userPubKey = ctx.session.user.id;
    return await PendingAssetList({ userPubKey: userPubKey });
  }),

  claimBalance: protectedProcedure
    .input(
      z.object({
        // trustLimit: z.number().positive({
        //   message: "Trust Limit must be greater than zero.",
        // }),
        balanceId: z.string().min(1, {
          message: "BalanceId is required.",
        }),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;

      return await AcceptClaimableBalance({
        userPubKey: userPubKey,
        balanceId: input.balanceId,
        signWith: input.signWith,

      });
    }),

  declineClaimBalance: protectedProcedure
    .input(
      z.object({
        // trustLimit: z.number().positive({
        //   message: "Trust Limit must be greater than zero.",
        // }),
        balanceId: z.string().min(1, {
          message: "BalanceId is required.",
        }),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;
      let secretKey;
      if (ctx.session.user.email && ctx.session.user.email.length > 0) {
        secretKey = await getAccSecretFromRubyApi(ctx.session.user.email);
      }
      return await DeclineClaimableBalance({
        pubKey: userPubKey,
        balanceId: input.balanceId,
        signWith: input.signWith,
        secretKey: secretKey,
      });
    }),

  checkingPlatformTrustLine: protectedProcedure.query(
    async ({ ctx, input }) => {
      const userPubKey = ctx.session.user.id;
      return await CheckHasTrustLineOnPlatformAsset({ userPubKey: userPubKey });
    },
  ),
  getPlatformAssetBalance: protectedProcedure.query(async ({ ctx, input }) => {
    const userPubKey = ctx.session.user.id;
    return await PlatformAssetBalance({ userPubKey: userPubKey });
  }),


});



