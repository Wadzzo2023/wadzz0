import { where } from "firebase/firestore";
import { z } from "zod";
import { PlaceMarketFormSchema } from "~/components/marketplace/modal/place_2storage_modal";
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
  placeNft2StorageXdr: protectedProcedure
    .input(PlaceMarketFormSchema.extend({ signWith: SignUser }))
    .mutation(async ({ input, ctx }) => {
      // validate and transfor input
      const { code, issuer, placingCopies, signWith } = input;

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
    .input(
      z.object({ code: z.string(), issuer: z.string(), price: z.number() }),
    )
    .mutation(async ({ input, ctx }) => {
      const { code, issuer, price } = input;

      const userId = ctx.session.user.id;

      const asset = await ctx.db.asset.findUnique({
        where: { code_issuer: { code, issuer } },
        select: { id: true, creatorId: true },
      });

      if (!asset) throw new Error("asset not found");

      let placerId = userId;

      await ctx.db.marketAsset.create({
        data: {
          placerId,
          price,
          assetId: asset.id,
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

      await ctx.db.marketAsset.deleteMany({
        where: {
          AND: [{ assetId: asset.id }, { placerId: userId }],
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
        where: { asset: { creatorId: { not: null } } },
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
        where: { asset: { creatorId: null } },
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
});
