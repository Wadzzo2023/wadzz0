import { where } from "firebase/firestore";
import { Keypair } from "stellar-sdk";
import { z } from "zod";
import { PlaceMarketFormSchema } from "~/components/marketplace/modal/place_2storage_modal";
import { BackMarketFormSchema } from "~/components/marketplace/modal/revert_place_market_modal";
import { env } from "~/env";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import { copyToBalance } from "~/lib/stellar/marketplace/test/acc";
import {
  sendNft2StorageXDR,
  sendNftback,
} from "~/lib/stellar/marketplace/trx/nft_2_storage";
import { SignUser } from "~/lib/stellar/utils";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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

      console.log(assetAmount);
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

      const placerId = userId;

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

      if (!id) throw new Error("id is required");

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
});
