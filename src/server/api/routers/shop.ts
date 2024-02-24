import { z } from "zod";
import { ShopItemSchema } from "~/components/creator/add-shop-item";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopRouter = createTRPCRouter({
  createShopAsset: protectedProcedure
    .input(ShopItemSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.issuer) {
        const asset = await ctx.db.asset.create({
          data: {
            code: input.AssetName,
            issuer: input.issuer.publicKey,
            issuerPrivate: input.issuer.secretKey,
            creatorId: ctx.session.user.id,
          },
        });
        await ctx.db.shopAsset.create({
          data: {
            name: input.name,
            price: input.price,
            description: input.description,
            creatorId: ctx.session.user.id,
            mediaUrl: input.mediaUrl,
            thumbnail: input.thumbnail,
            assetId: asset.id,
          },
        });
      }
    }),

  deleteAsset: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.asset.delete({
        where: { id: input, creatorId: ctx.session.user.id },
      });
    }),
  getCreatorShopAsset: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.shopAsset.findMany({
        where: { creatorId: input.creatorId },
        include: { asset: { select: { code: true, issuer: true } } },
      });
    }),

  getAllShopAsset: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.shopAsset.findMany({
      where: { creatorId: ctx.session.user.id },
      include: { asset: { select: { code: true, issuer: true } } },
    });
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  search: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
        searchInput: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor, searchInput } = input;
      const items = await ctx.db.shopAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          OR: [
            {
              name: {
                contains: searchInput,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: searchInput,
                mode: "insensitive",
              },
            },
            {
              asset: {
                code: {
                  contains: searchInput,
                  mode: "insensitive",
                },
                issuer: {
                  contains: searchInput,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        include: { asset: { select: { code: true, issuer: true } } },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  buyAsset: protectedProcedure
    .input(z.object({ shopAssetId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { shopAssetId } = input;
      return await ctx.db.userShopAsset.create({
        data: {
          userId: ctx.session.user.id,
          shopAssetId: shopAssetId,
        },
      });
    }),

  getAllPopularAsset: publicProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor } = input;
      const items = await ctx.db.shopAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { UserShopAsset: { _count: "desc" } },
        include: { asset: { select: { code: true, issuer: true } } },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getUserShopAsset: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.userShopAsset.findMany({
      where: { userId: ctx.session.user.id },
      include: { shopAsset: { include: { asset: true } } },
    });
  }),
});
