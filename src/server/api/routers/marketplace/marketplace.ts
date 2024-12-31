import { where } from "firebase/firestore";
import { Keypair } from "@stellar/stellar-sdk";
import { z } from "zod";
import { PlaceMarketFormSchema } from "~/components/marketplace/modal/place_2storage_modal";
import { BackMarketFormSchema } from "~/components/marketplace/modal/revert_place_market_modal";
import { env } from "~/env";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import {
  sendNft2StorageXDR,
  sendNftback,
} from "~/lib/stellar/marketplace/trx/nft_2_storage";
import { SignUser } from "~/lib/stellar/utils";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getAssetBalance } from "~/lib/stellar/marketplace/test/acc";
import { ItemPrivacy } from "@prisma/client";

export const AssetSelectAllProperty = {
  code: true,
  name: true,
  issuer: true,
  creatorId: true,
  thumbnail: true,
  privacy: true,
  description: true,
  id: true,
  mediaType: true,
  mediaUrl: true,
  limit: true,
  tierId: true,
  tier: true,
};

export const marketRouter = createTRPCRouter({
  placeNft2StorageXdr: protectedProcedure
    .input(PlaceMarketFormSchema.extend({ signWith: SignUser }))
    .mutation(async ({ input, ctx }) => {
      // validate and transfer input
      const { code, issuer, placingCopies, signWith } = input;

      const creatorId = ctx.session.user.id;
      const storage = await ctx.db.creator.findUnique({
        where: { id: creatorId },
        select: { storagePub: true, storageSecret: true },
      });
      if (!storage?.storagePub) {
        throw new Error("storage does not exist");
      }

      const assetAmount = placingCopies.toString();

      // stellar sdk for xdr
      return await sendNft2StorageXDR({
        assetAmount,
        assetCode: code,
        signWith,
        issuerPub: issuer,
        storageSec: storage.storageSecret,
        userPub: creatorId,
      });
    }),

  placeBackNftXdr: protectedProcedure
    .input(BackMarketFormSchema.extend({ signWith: SignUser }))
    .mutation(async ({ ctx, input }) => {
      // validate and transfor input
      const { code, issuer, placingCopies, signWith } = input;

      const creatorId = ctx.session.user.id;
      const storage = await ctx.db.creator.findUnique({
        where: { id: creatorId },
        select: { storageSecret: true },
      });
      if (!storage?.storageSecret) {
        throw new Error("storage does not exist");
      }

      const assetAmount = placingCopies.toString();

      // console.log(assetAmount);
      // stellear sdk for xdr
      return await sendNftback({
        assetAmount,
        assetCode: code,
        signWith,
        issuerPub: issuer,
        storageSecret: storage.storageSecret,
        userPub: creatorId,
      });
    }),

  placeToMarketDB: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        issuer: z.string(),
        price: z.number(),
        priceUSD: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { code, issuer, price, priceUSD } = input;

      const userId = ctx.session.user.id;

      const asset = await ctx.db.asset.findUnique({
        where: { code_issuer: { code, issuer } },
      });

      if (!asset) throw new Error("asset not found");

      const placerId = userId;

      await ctx.db.marketAsset.create({
        data: {
          placerId,
          price,
          assetId: asset.id,
          priceUSD,
          privacy: asset.privacy,
        },
      });
    }),

  disableToMarketDB: protectedProcedure
    .input(z.object({ code: z.string(), issuer: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { code, issuer } = input;

      const userId = ctx.session.user.id;

      const asset = await ctx.db.asset.findUnique({
        where: { code_issuer: { code, issuer } },
        select: { id: true, creatorId: true },
      });

      if (!asset) throw new Error("asset not found");
      ``;

      console.log("asset", asset, code, issuer);

      await ctx.db.marketAsset.deleteMany({
        where: {
          AND: [{ assetId: asset.id }, { placerId: userId }],
        },
      });
    }),

  getFanMarketNfts: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, skip } = input;

      const items = await ctx.db.marketAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          asset: {
            select: AssetSelectAllProperty,
          },
        },
        where: { placerId: { not: null }, type: { equals: "FAN" } },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        nfts: items,
        nextCursor,
      };
    }),

  getPageAssets: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.string().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, skip } = input;

      const items = await ctx.db.creatorPageAsset.findMany({
        include: {
          creator: {
            select: {
              name: true,
              profileUrl: true,
            },
          },
        },
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { creatorId: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.creatorId;
      }

      return {
        nfts: items,
        nextCursor,
      };
    }),

  getMarketAdminNfts: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, skip } = input;

      const items = await ctx.db.marketAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          asset: {
            select: AssetSelectAllProperty,
          },
        },
        where: { type: "ADMIN" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        nfts: items,
        nextCursor,
      };
    }),

  getCreatorNftsByCreatorID: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
        creatorId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, skip, creatorId } = input;

      const items = await ctx.db.marketAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          asset: {
            select: AssetSelectAllProperty,
          },
        },
        where: { asset: { creatorId: creatorId } },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        nfts: items,
        nextCursor,
      };
    }),

  getACreatorNfts: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, skip } = input;
      const creatorId = ctx.session.user.id;

      const items = await ctx.db.marketAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          asset: {
            select: AssetSelectAllProperty,
          },
        },
        where: { asset: { creatorId: creatorId } },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        nfts: items,
        nextCursor,
      };
    }),

  getSongAssetAvailableCopy: protectedProcedure
    .input(z.object({ code: z.string(), issuer: z.string() }))
    .query(async ({ ctx, input }) => {
      const { code, issuer } = input;

      const adminStoragePub = Keypair.fromSecret(
        env.STORAGE_SECRET,
      ).publicKey();

      const bal = await StellarAccount.create(adminStoragePub);
      const copy = bal.getTokenBalance(code, issuer);
      return copy;
    }),

  getMarketAssetAvailableCopy: protectedProcedure
    .input(z.object({ id: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;

      if (!id) {
        //  throw new Error("id is required");

        return 0;
      }

      const marketItem = await ctx.db.marketAsset.findUnique({
        where: { id },
        include: { asset: { select: { code: true, issuer: true } } },
      });

      if (!marketItem) throw new Error("market item not found");

      const placerId = marketItem.placerId;

      if (placerId) {
        // placer have to be creator, have an storage account,
        const placer = await ctx.db.creator.findUnique({
          where: { id: placerId },
        });

        if (!placer) throw new Error("seller not found");

        const placerStorage = placer.storagePub;

        const bal = await StellarAccount.create(placerStorage);
        const copy = bal.getTokenBalance(
          marketItem.asset.code,
          marketItem.asset.issuer,
        );

        return copy;
      } else {
        // admin or original item
        const adminStorage = Keypair.fromSecret(env.STORAGE_SECRET).publicKey();

        const bal = await StellarAccount.create(adminStorage);
        const copy = bal.getTokenBalance(
          marketItem.asset.code,
          marketItem.asset.issuer,
        );

        return copy;
      }
      // return copies.length;
    }),

  deleteMarketAsset: adminProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.marketAsset.delete({
        where: { id: input },
        include: { asset: true },
      });
    }),

  userCanBuyThisMarketAsset: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const pubkey = ctx.session.user.id;

      const stellarAcc = await StellarAccount.create(pubkey);

      // check
      const marketAsset = await ctx.db.marketAsset.findUnique({
        where: { id: input },
        include: {
          asset: {
            include: {
              tier: { include: { creator: { include: { pageAsset: true } } } },
            },
          },
        },
      });

      if (!marketAsset) return false;

      if (marketAsset.privacy === ItemPrivacy.PUBLIC) {
        return true;
      }

      // secondary market if placerId is not the creatorId
      if (marketAsset.placerId !== marketAsset.asset.creatorId) {
        return true;
      }

      const tier = marketAsset.asset.tier;

      if (tier) {
        const pageAsset = tier.creator.pageAsset;

        if (pageAsset) {
          if (marketAsset.privacy === ItemPrivacy.PRIVATE) {
            const { code, issuer } = pageAsset;
            const hasTrust = stellarAcc.hasTrustline(code, issuer);

            if (hasTrust) {
              return true;
            }
          } else if (marketAsset.privacy === ItemPrivacy.TIER) {
            const { code, issuer } = pageAsset;
            const bal = stellarAcc.getTokenBalance(code, issuer);
            if (bal >= tier.price) {
              return true;
            }
          }
        }
      }
    }),
});
