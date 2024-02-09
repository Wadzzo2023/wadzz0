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
          thumbnail: "test",
          assetId: asset.id,
        },
      });

      // global notification
      // await ctx.db.notification.create({
    }),

  getCreatorShopAsset: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx , input}) => {
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

  search: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return await ctx.db.shopAsset.findMany({
      where: {
        OR: [
          {
            name: {
              contains: input,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: input,
              mode: "insensitive",
            },
          },
          {
            asset: {
              code: {
                contains: input,
                mode: "insensitive",
              },
              issuer: {
                contains: input,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: { asset: { select: { code: true, issuer: true } } },
    });
  }),
});
