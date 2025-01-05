import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { AlbumFormShema } from "~/components/music/modal/album_create";
import { AssetSelectAllProperty } from "../marketplace/marketplace";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import { ItemPrivacy } from "@prisma/client";

export const albumRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.album.findMany();
  }),

  getById: protectedProcedure
    .input(z.object({ albumId: z.number() }))
    .query(async ({ input, ctx }) => {
      const currentUserId = ctx.session.user.id;
      const albumSongs = await ctx.db.album.findUnique({
        where: { id: input.albumId },
        include: {
          songs: {
            include: {
              asset: {
                select: {
                  ...AssetSelectAllProperty,
                  tier: {
                    select: {
                      price: true,
                    },
                  },
                  creator: {
                    select: {
                      pageAsset: {
                        select: {
                          code: true,
                          issuer: true,
                        },
                      },
                      customPageAssetCodeIssuer: true,
                    },
                  },
                },
              },
            },
          },


        },
      });


      const stellarAcc = await StellarAccount.create(currentUserId);


      // Filter items based on privacy and conditions
      const array = albumSongs?.songs.filter((item) => {
        if (item.asset.creator?.pageAsset) {
          const creatorPageAsset = item.asset.creator?.pageAsset;

          if (item.creatorId === currentUserId) {
            return true;
          }
          if (item.asset.privacy === ItemPrivacy.PUBLIC) {
            return true;
          }
          if (item.asset.privacy === ItemPrivacy.PRIVATE) {
            return creatorPageAsset && stellarAcc.hasTrustline(creatorPageAsset.code, creatorPageAsset.issuer);
          }
          if (item.asset.privacy === ItemPrivacy.TIER) {
            return (
              creatorPageAsset &&
              item.asset.tier &&
              item.asset.tier.price <= stellarAcc.getTokenBalance(creatorPageAsset.code, creatorPageAsset.issuer)
            );
          }
        }
        else if (item.asset.creator?.customPageAssetCodeIssuer) {

          const customPageAsset = item.asset.creator.customPageAssetCodeIssuer;

          const [code, issuer] = customPageAsset.split("-");

          if (item.creatorId === currentUserId) {
            return true;
          }
          if (item.asset.privacy === ItemPrivacy.PUBLIC) {
            return true;
          }
          if (item.asset.privacy === ItemPrivacy.PRIVATE) {
            if (code && issuer)
              return stellarAcc.hasTrustline(code, issuer);
          }
          if (item.asset.privacy === ItemPrivacy.TIER) {
            return (
              code && issuer &&
              item.asset.tier &&
              item.asset.tier.price <= stellarAcc.getTokenBalance(code, issuer)
            );
          }

        }
        else if (item.creatorId === null) {
          return true;
        }

        return false;
      });
      return { ...albumSongs, songs: array ?? [] };
    }),

  delete: adminProcedure
    .input(z.object({ albumId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.album.delete({
        where: { id: input.albumId },
      });
    }),

  create: publicProcedure
    .input(AlbumFormShema)

    .mutation(async ({ input, ctx }) => {
      const { coverImgUrl, description, name } = input;
      await ctx.db.album.create({ data: { name, coverImgUrl, description } });
    }),

  update: protectedProcedure
    .input(AlbumFormShema)
    .mutation(async ({ input, ctx }) => {
      if (input.id) {
        const album = await ctx.db.album.findUnique({
          where: { id: input.id },
        });
        if (!album)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Album not found",
          });
        await ctx.db.album.update({
          where: { id: input.id },
          data: { ...input },
        });
      }
    }),
});
