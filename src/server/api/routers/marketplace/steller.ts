import { TRPCError } from "@trpc/server";
import { z } from "zod";
import log from "~/lib/logger/logger";
import {
  MOTHER_SECRET,
  STORAGE_SECRET,
} from "~/lib/stellar/marketplace/SECRET";
import { buyNftTransection } from "~/lib/stellar/marketplace/trx/buy_nft_xdr";
import {
  getAccBalance,
  getBalncesOfStorag,
} from "~/lib/stellar/marketplace/trx/create_song_token";

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
        secret: z.string().min(56).optional(),
        sellerAcc: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { limit, assetCode, issuerPub, pubkey, price, secret, sellerAcc } =
        input;
      try {
        const xdr = await buyNftTransection({
          assetCode,
          issuerPub,
          userPub: pubkey,
          limit,
          price,
          secret,
          sellerPub: sellerAcc,
        });
        if (xdr) {
          return xdr;
        }
      } catch (e: any) {
        if (e.response) {
          log.info(e.response.detail);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: e.response.detail,
          });
        } else if (e.message) {
          log.info(e.message);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: e.message,
          });
        } else
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Unkown Error`,
          });
      }
    }),

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

      const secret = await getUserSecret({ uid, email });

      const xdr = await covertSiteAsset2XLM({
        pubkey,
        xlm,
        siteAssetAmount,
        secret,
      });
      return xdr;
    }),

  getToml: publicProcedure.query(async () => {
    // const collectionRef = collection(db, FSdocName.nfts);

    // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
    // const q = query(collectionRef, orderBy("songAsset"));
    // // Fetch the documents based on the query.
    // const querySnapshot = await getDocs(q);
    // const songs = querySnapshot.docs.map((doc) => {
    //   return doc.data() as NFT;
    // });

    // // [DOCUMENTATION];
    // // issuer = "get asset issuer";
    // // code = "get asset code";
    // // name = "get asset name";
    // // desc = "This is a description of the cool NFT.";
    // // image = "ipfs link ending with file format extension";
    // // limit = limit;
    // // display_decimals = 7;

    // for (const song of songs) {
    // }
    // return songs;
    return [];
  }),

  getStorageBalances: publicProcedure.query(() => {
    return getBalncesOfStorag();
  }),

  getAccBalances: publicProcedure
    .input(z.object({ pub: z.string().min(56) }))
    .query(({ input }) => {
      return getAccBalance(input.pub);
    }),

  getSecrets: protectedProcedure.query(() => {
    return {
      STORAGE_SECRET,
      MOTHER_SECRET,
    };
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
