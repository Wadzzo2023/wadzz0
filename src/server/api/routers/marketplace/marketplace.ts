import { where } from "firebase/firestore";
import { z } from "zod";
import { PlaceMarketFormSchema } from "~/components/marketplace/modal/place_market_modal";
import { BackMarketFormSchema } from "~/components/marketplace/modal/revert_place_market_modal";
import { copyToBalance } from "~/lib/stellar/marketplace/test/acc";
import {
  sendNft2StorageXDR,
  sendNftback,
} from "~/lib/stellar/marketplace/trx/nft_2_storage";
import { SignUser } from "~/lib/stellar/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const AssetSelectAllProperty = {
  code: true,
  name: true,
  price: true,
  issuer: true,
  creatorId: true,
  thumbnail: true,
  privacy: true,
  description: true,
  id: true,
  limit: true,
  mediaType: true,
  mediaUrl: true,
};

export const marketRouter = createTRPCRouter({
  placeNft2MarketXdr: protectedProcedure
    .input(PlaceMarketFormSchema.extend({ signWith: SignUser }))
    .mutation(async ({ input, ctx }) => {
      // validate and transfor input
      const { code, issuer, placingCopies, price, signWith } = input;

      const creatorId = ctx.session.user.id;
      const storage = await ctx.db.creator.findUnique({
        where: { id: creatorId },
        select: { storagePub: true },
      });
      if (!storage?.storagePub) {
        throw new Error("storage does not exist");
      }

      const assetAmount = copyToBalance(placingCopies);

      // stellear sdk for xdr
      return await sendNft2StorageXDR({
        assetAmount,
        assetCode: code,
        signWith,
        issuerPub: issuer,
        storagePub: storage.storagePub,
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

      const assetAmount = copyToBalance(placingCopies);

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
    .input(PlaceMarketFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { code, issuer, placingCopies, price } = input;
      const creatorId = ctx.session.user.id;
      const asset = await ctx.db.asset.findUnique({
        where: { code_issuer: { code, issuer } },
        select: { id: true },
      });

      if (!asset) throw new Error("asset not found");

      await ctx.db.marketAsset.create({
        data: {
          limit: 999,
          assetId: asset.id,
          creatorId: ctx.session.user.id,
        },
      });
    }),

  getFanMarketNft: protectedProcedure
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
        where: { disabled: false, creatorId: { not: null } },
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

  getMarketAdminNft: protectedProcedure
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
        where: { disabled: false, creatorId: null },
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

  toggleVisibilityMarketNft: protectedProcedure
    .input(z.object({ id: z.number(), visibility: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const marketAssetId = input.id;
      const creatorId = ctx.session.user.id;

      // validate the request marketassetId is created by the user
      const asset = await ctx.db.marketAsset.findUnique({
        where: { id: marketAssetId },
        select: { creatorId: true },
      });

      if (!asset) throw new Error("asset not found");

      if (asset.creatorId !== creatorId) throw new Error("not authorized");

      await ctx.db.marketAsset.update({
        where: { id: marketAssetId },
        data: { disabled: !input.visibility },
      });
    }),
  changeVisibilityMarketNft: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        issuer: z.string(),
        visibility: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { code, issuer, visibility } = input;

      const assetRow = await ctx.db.asset.findUnique({
        where: { code_issuer: { code, issuer } },
        select: { id: true },
      });

      if (!assetRow) throw new Error("asset not found");
      const assetId = assetRow.id;
      const creatorId = ctx.session.user.id;

      // validate the request marketassetId is created by the user
      const asset = await ctx.db.marketAsset.findUnique({
        where: { assetId_creatorId: { assetId, creatorId } },
        select: { id: true },
      });

      if (!asset) throw new Error("asset not found");

      await ctx.db.marketAsset.update({
        where: { id: asset.id },
        data: { disabled: !visibility },
      });
    }),
});
