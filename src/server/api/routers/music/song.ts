import { z } from "zod";

import { SongFormSchema } from "~/components/music/modal/song_create";
import { accountDetailsWithHomeDomain } from "~/lib/stellar/marketplace/test/acc";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { AssetSelectAllProperty } from "../marketplace/marketplace";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import { ItemPrivacy } from "@prisma/client";

export const songRouter = createTRPCRouter({
  getAllSong: publicProcedure.query(async ({ ctx }) => {
    const songs = await ctx.db.song.findMany({
      include: { asset: { select: AssetSelectAllProperty } },
      // take: 10,
    });

    return songs
  }),

  getCreatorPublicSong: protectedProcedure.query(async ({ ctx }) => {
    const assets = await ctx.db.song.findMany({
      where: {
        asset: {
          privacy: "PUBLIC",
        },
      },
      select: {
        asset: { select: AssetSelectAllProperty },
        id: true,
        price: true,
        priceUSD: true,
        createdAt: true,
        artist: true,
        albumId: true,
        assetId: true,
        creatorId: true,
      },
    });
    console.log(assets);

    return assets;
  }),

  deleteCreatorPublicSong: adminProcedure
    .input(
      z.object({
        songId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.asset.delete({
        where: { id: input.songId },
      });
    }),

  getCreatorMarketSong: protectedProcedure.query(async ({ ctx }) => {
    const songs = await ctx.db.marketAsset.findMany({
      include: { asset: { select: AssetSelectAllProperty } },
      where: {
        type: { equals: "FAN" },
        asset: { mediaType: { equals: "MUSIC" }, tier: { isNot: null } },
      },
    });

    return songs;
  }),

  getAllSongMarketAssets: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, skip } = input;
      const currentUserId = ctx.session.user.id;

      const items = await ctx.db.marketAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
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
                },
              },
            },
          },
        },
        where: { type: { equals: "SONG" }, placerId: null },
      });

      const stellarAcc = await StellarAccount.create(currentUserId);

      // Filter items based on privacy and conditions
      const array = items.filter((item) => {
        const creatorPageAsset = item.asset.creator?.pageAsset;

        if (item.asset.privacy === ItemPrivacy.PUBLIC) {
          return true;
        }

        if (item.asset.creatorId !== item.placerId) {
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

        return false;
      });

      // Handle pagination
      let nextCursor: typeof cursor | undefined = undefined;
      if (array.length > limit) {
        const nextItem = array.pop();
        nextCursor = nextItem?.id;
      }

      return {
        nfts: array,
        nextCursor,
      };
    }),


  getAllSongsByPrivacy: publicProcedure.query(async ({ input }) => {
    return [];
  }),

  getAllSongsWithAssetCode: publicProcedure.query(async () => {
    return [];
  }),

  getUserBuyedSongs: protectedProcedure.query(async ({ ctx }) => {
    const userPub = ctx.session.user.id;
    const { tokens: assets } = await accountDetailsWithHomeDomain({ userPub });

    const foundSongs = await ctx.db.song.findMany({
      where: {
        OR: assets.map((asset) => ({
          asset: { code: asset.code, issuer: asset.issuer },
        })),
      },
      include: { asset: { select: AssetSelectAllProperty } },
    });
    // return songs;

    return foundSongs;
  }),

  getAllSongBasedOnUserPubkey: publicProcedure
    .input(z.object({ pubKey: z.string(), asset: z.string().optional() }))
    .query(async ({ input }) => {
      return [];
    }),

  getAllByAlbum: protectedProcedure
    .input(z.object({ albumId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.song.findMany({ where: { albumId: input.albumId } });
    }),

  getAllByAlbumBasedonUserPub: publicProcedure
    .input(z.object({ pubKey: z.string(), albumId: z.string() }))
    .query(async ({ input }) => {
      return [];
    }),

  getAsong: publicProcedure
    .input(z.object({ songId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.song.findUnique({
        where: { id: input.songId },
        include: {
          asset: {
            select: {
              name: true,
              code: true,
              thumbnail: true,
              issuer: true,
              mediaUrl: true,
            },
          },
        },
      });
    }),

  getSongByCodeIssuer: publicProcedure.input(z.object({ code: z.string().optional(), issuer: z.string().optional() })).query(async ({ input, ctx }) => {
    const song = await ctx.db.song.findFirst({
      where: {
        asset: {
          code: input.code,
          issuer: input.issuer,
        },
      },
      select: {
        asset: {
          select: {
            name: true,
            code: true,
            thumbnail: true,
            issuer: true,
            mediaUrl: true,
          },
        },
        albumId: true,
        artist: true,
        assetId: true,
        createdAt: true,
        price: true,
        priceUSD: true,
        id: true,
      }
    });
    return song;
  }
  ),

  deleteAsong: adminProcedure
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.song.delete({
        where: { id: input.songId },
        include: { asset: { include: { marketItems: true } } },
      });
    }),

  create: protectedProcedure
    .input(SongFormSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        artist,
        coverImgUrl,
        albumId,
        musicUrl,
        description,
        priceUSD,
        price,
        limit,
        name,
        code,
        issuer,
        tier
      } = input;
      const serialNumber = 1; // will query based on createdAt

      if (issuer) {
        await ctx.db.asset.create({
          data: {
            code,
            issuer: issuer.publicKey,
            issuerPrivate: issuer.secretKey,
            song: {
              create: {
                artist,
                price,
                albumId,
                priceUSD,
              },
            },
            marketItems: { create: { price, type: "SONG" } },
            mediaType: "MUSIC",
            name,

            mediaUrl: musicUrl,
            thumbnail: coverImgUrl,
            description: description,
            limit,

          },
        });
      }
    }),

  buySong: protectedProcedure
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // await ctx.db.Song_
    }),

  changePrivacy: protectedProcedure
    .input(
      z.object({
        songId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // const { privacy, songId } = input;
      // const docRef = doc(db, FCname.songs, songId);
      // await updateDoc(docRef, { privacy: privacy });
    }),
  deletePublicSong: protectedProcedure
    .input(
      z.object({
        songId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = ctx.session.user;
      const isAdmin = await ctx.db.admin.findUnique({ where: { id } });
      const isCreator = await ctx.db.asset.findUnique({
        where: { creatorId: id, id: input.songId },
      });

      if (!isAdmin && !isCreator) {
        throw new Error("You are not an admin/creator");
      }

      return await ctx.db.asset.delete({
        where: { id: input.songId },
      });
    }),
});
