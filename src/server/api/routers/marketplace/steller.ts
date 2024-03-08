import { z } from "zod";

// import { getUserSecret } from "~/components/recharge/utils";
import { covertSiteAsset2XLM } from "~/lib/stellar/marketplace/trx/convert_site_asset";
import { alreadyHaveTrustOnNft } from "~/lib/stellar/marketplace/trx/utils";
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
  convertSiteAsset: publicProcedure
    .input(
      z.object({
        pubkey: z.string(),
        xlm: z.string(),
        siteAssetAmount: z.number(),
        uid: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const { pubkey, uid, email, siteAssetAmount, xlm } = input;

      const secret = getUserSecret({ uid, email });

      const xdr = await covertSiteAsset2XLM({
        pubkey,
        xlm,
        siteAssetAmount,
        secret,
      });
      return xdr;
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

function getUserSecret(arg0: { uid: string; email: string }) {
  return "testSecret";
}
