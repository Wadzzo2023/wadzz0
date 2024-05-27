import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { Keypair } from "stellar-sdk";
import { z } from "zod";
import { getUserSecret } from "~/components/marketplace/recharge/utils";
import { env } from "~/env";
import { copyToBalance } from "~/lib/stellar/marketplace/test/acc";

// import { getUserSecret } from "~/components/recharge/utils";
import { covertSiteAsset2XLM } from "~/lib/stellar/marketplace/trx/convert_site_asset";
import { alreadyHaveTrustOnNft } from "~/lib/stellar/marketplace/trx/utils";
import { XDR4BuyAsset } from "~/lib/stellar/music/trx/payment_xdr";
import { SignUser } from "~/lib/stellar/utils";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export type authDocType = {
  pubkey: string;
  secret: string;
};

export const stellarRouter = createTRPCRouter({
  buyFromMarketPaymentXDR: protectedProcedure // this contrained to only fans activity
    .input(
      z.object({
        assetCode: z.string(),
        issuerPub: z.string(),
        limit: z.number(),
        placerId: z.string().optional().nullable(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { limit: l, assetCode, issuerPub, signWith, placerId } = input;

      const buyer = ctx.session.user.id; // customer pubkey

      const dbAsset = await ctx.db.asset.findUnique({
        where: { code_issuer: { code: assetCode, issuer: issuerPub } },
        select: { creatorId: true, id: true },
      });

      if (!dbAsset) throw new Error("asset not found");

      const marketAsset = await ctx.db.marketAsset.findFirst({
        where: { AND: [{ assetId: dbAsset.id }, { placerId: placerId }] },
        select: { price: true },
      });

      if (!marketAsset) throw new Error("asset is not in market");

      // validate and transfor input

      let seller: string;
      let sellerStorageSec: string;

      if (placerId) {
        seller = placerId;

        const storage = await ctx.db.creator.findUnique({
          where: { id: placerId },
          select: { storageSecret: true },
        });
        if (!storage?.storageSecret) {
          throw new Error("storage does not exist");
        }
        sellerStorageSec = storage.storageSecret;
      } else {
        // admin asset or music
        seller = Keypair.fromSecret(env.MOTHER_SECRET).publicKey();
        sellerStorageSec = env.STORAGE_SECRET;
      }

      const limit = copyToBalance(l);

      return await XDR4BuyAsset({
        seller: seller,
        storageSecret: sellerStorageSec,
        code: assetCode,
        issuerPub,
        buyer,
        price: marketAsset.price.toString(),
        signWith,
      });
    }),

  convertSiteAsset: protectedProcedure
    .input(
      z.object({
        xlm: z.string(),
        siteAssetAmount: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { siteAssetAmount, xlm } = input;
      const user = ctx.session.user;

      if (user.email) {
        const secret = await getAccSecretFromRubyApi(user.email);

        const xdr = await covertSiteAsset2XLM({
          pubkey: user.id,
          xlm,
          siteAssetAmount,
          secret,
        });
        return xdr;
      } else {
        throw new Error("No email attached to the account");
      }
    }),

  hasTrust: publicProcedure
    .input(
      z.object({
        pubkey: z.string(),
        asset: z.object({ code: z.string(), issuer: z.string() }),
      }),
    )
    .query(async ({ input }) => {
      const { asset, pubkey } = input;
      return await alreadyHaveTrustOnNft({ asset, pubkey });
    }),

  test: publicProcedure.query(() => {
    return "test";
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
