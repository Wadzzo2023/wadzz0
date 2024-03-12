import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { SongFormSchema } from "~/components/music/modal/song_create";
import { AssetSelectAllProperty } from "../marketplace/marketplace";

export const songRouter = createTRPCRouter({
  getAllSong: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.song.findMany({ include: { asset: true } });
  }),

  getAllSongAssets: protectedProcedure
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

      const items = await ctx.db.song.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          asset: {
            select: AssetSelectAllProperty,
          },
        },
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

  getAllSongsByPrivacy: publicProcedure.query(async ({ input }) => {
    return [];
  }),

  getAllSongsWithAssetCode: publicProcedure.query(async () => {
    return [];
  }),

  getUserBuyedSongs: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.song.findMany({
      include: {
        asset: {
          select: { thumbnail: true, code: true, issuer: true, name: true },
        },
      },
    });
    // return songs;
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

  deleteAsong: adminProcedure
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.song.delete({ where: { id: input.songId } });
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
        price,
        name,
        code,
        issuer,
      } = input;
      const serialNumber = 1; // will query based on createdAt
      const duration = "1.1"; // just demo

      if (issuer) {
        await ctx.db.asset.create({
          data: {
            code,
            issuer: issuer.publicKey,
            issuerPrivate: issuer.secretKey,
            Song: {
              create: {
                artist,
                albumId,
              },
            },
            limit: 34,
            mediaType: "IMAGE",
            name,
            mediaUrl: musicUrl,
            thumbnail: coverImgUrl,
            price: price,
            description: description,
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
});
