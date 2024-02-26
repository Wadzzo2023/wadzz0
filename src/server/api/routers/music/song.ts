import { z } from "zod";
import { SongPrivacy, ZodSongAsset } from "~/lib/music/types/dbTypes";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { ADMIN_MASTER_PUBKEY } from "~/utils/music/constants";
import { ASSETS } from "~/lib/stellar/music/constant";
import { getUserAllAssetsInSongAssets } from "~/lib/stellar/music/utils/asset";
import { firstTransection } from "~/lib/stellar/music/trx/create_song_token";
import log from "~/lib/logger/logger";
import { SongFormSchema } from "~/components/music/modal/song_create";

export const songRouter = createTRPCRouter({
  getAllSong: publicProcedure.query(async ({ ctx }) => {
    return [];
  }),
  getAllSongWithOrderByAndLimit: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        orderBy: z.enum(["views", "date"]),
      }),
    )
    .query(async ({ input }) => {
      return [];
      // const songLimit = input.limit ? input.limit : 6;
      // const orderby = input.orderBy;

      // const collectionRef = collection(db, FCname.songs);

      // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
      // const q = query(collectionRef, orderBy(input.orderBy), limit(songLimit));
      // // Fetch the documents based on the query.
      // const querySnapshot = await getDocs(q);
      // const songs = querySnapshot.docs.map((doc) => {
      //   return doc.data() as Song;
      // });
      // return songs;
    }),

  getAllSongsByPrivacy: publicProcedure
    .input(z.object({ privacy: z.nativeEnum(SongPrivacy) }))
    .query(async ({ input }) => {
      return [];
      // const collectionRef = collection(db, FCname.songs);

      // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
      // const q = query(collectionRef, where("privacy", "==", input.privacy));
      // // Fetch the documents based on the query.
      // const querySnapshot = await getDocs(q);
      // const songs = querySnapshot.docs.map((doc) => {
      //   return doc.data() as Song;
      // });
      // return songs;
    }),

  getAllSongsWithAssetCode: publicProcedure.query(async () => {
    return [];
    // const collectionRef = collection(db, FCname.songs);

    // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
    // const q = query(collectionRef, orderBy("songAsset"));
    // // Fetch the documents based on the query.
    // const querySnapshot = await getDocs(q);
    // const songs = querySnapshot.docs.map((doc) => {
    //   return doc.data() as Song;
    // });
    // return songs;
  }),

  getUserBuyedSongs: publicProcedure
    .input(z.object({ pubkey: z.string().length(56) }))
    .query(async ({ input }) => {
      return [];
      // const collectionRef = collection(db, FCname.songs);

      // const userDocRef = doc(db, FCname.users, input.pubkey);
      // // Get the user's document
      // const userDocSnapshot = await getDoc(userDocRef);

      // let userSongs: string[] = [];

      // if (userDocSnapshot.exists()) {
      //   // Access the songs array from the user's document data
      //   const userData = userDocSnapshot.data();
      //   userSongs = (userData.songs as string[]) || []; // Default to an empty array if songs is not defined
      // } else {
      //   log.info("User document does not exist.");
      //   userSongs = [];
      // }

      // const q = query(collectionRef, where("id", "in", userSongs));

      // const querySnapshot = await getDocs(q);
      // const songs = querySnapshot.docs.map((doc) => {
      //   return doc.data() as Song;
      // });
      // return songs;
    }),

  getAllSongBasedOnUserPubkey: publicProcedure
    .input(z.object({ pubKey: z.string(), asset: z.string().optional() }))
    .query(async ({ input }) => {
      return [];
      //   const collectionRef = collection(db, FCname.songs);
      //   // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
      //   const assetWithIssuerArray = await getUserAllAssetsInSongAssets(
      //     input.pubKey,
      //     ASSETS,
      //   );

      //   if (!assetWithIssuerArray) return [];

      //   let q = query(
      //     collectionRef,
      //     where("privacy", "==", SongPrivacy.RESTRICTED),
      //     where("assetWithIssuer", "in", assetWithIssuerArray),
      //   );
      //   if (input.asset) {
      //     q = query(
      //       collectionRef,
      //       where("privacy", "==", SongPrivacy.RESTRICTED),
      //       where("assetWithIssuer", "==", input.asset),
      //     );
      //   }
      //   // Fetch the documents based on the query.
      //   const querySnapshot = await getDocs(q);
      //   const songs = querySnapshot.docs.map((doc) => {
      //     return doc.data() as Song;
      //   });
      //   return songs;
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
      // const albumRef = doc(db, FCname.albums, input.albumId);

      // const assetInPublic = await getUserAllAssetsInSongAssets(
      //   input.pubKey,
      //   ASSETS,
      // );
      // log.info("here", assetInPublic);
      // if (!assetInPublic) return [];

      // // Fetch the album document
      // const albumDoc = await getDoc(albumRef);
      // const songs: Song[] = [];
      // if (albumDoc.exists()) {
      //   // Access the "songs" array field from the document's data
      //   const songsArray = albumDoc.data().songs as string[];

      //   if (Array.isArray(songsArray)) {
      //     for (const songId of songsArray) {
      //       const songDoc = await getDoc(doc(db, FCname.songs, songId));
      //       const song = songDoc.data() as Song;
      //       // if (song.assetWithIssuer) {
      //       //   if (assetInPublic.includes(song.assetWithIssuer))
      //       //     songs.push(song);
      //       // }
      //     }
      //   } else {
      //     log.info("The 'songs' field is not an array.");
      //   }
      // } else {
      //   log.info("Album document does not exist.");
      // }

      // // const snapAsset = await getDoc(doc(db, FCname.albums));
      // return songs;
    }),

  getAsong: publicProcedure
    .input(z.object({ songId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.song.findUnique({ where: { id: input.songId } });
    }),

  deleteAsong: adminProcedure
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.song.delete({ where: { id: input.songId } });
    }),

  create: protectedProcedure
    .input(SongFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { artist, coverImgUrl, albumId, musicUrl, name, code, issuer } =
        input;
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
                coverImgUrl,
                duration,
                musicUrl,
                name,
                serialNumber,
                albumId,
              },
            },
          },
        });
      }
    }),

  changePrivacy: protectedProcedure
    .input(
      z.object({
        privacy: z.enum([SongPrivacy.DRAFT, SongPrivacy.RESTRICTED]),
        songId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // const { privacy, songId } = input;
      // const docRef = doc(db, FCname.songs, songId);
      // await updateDoc(docRef, { privacy: privacy });
    }),
});
