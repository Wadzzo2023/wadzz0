import { z } from "zod";
import { SongPrivacy, ZodSongAsset } from "~/lib/music/types/dbTypes";

import {
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
    .input(z.object({ albumId: z.string() }))
    .query(async ({ input }) => {
      return [];
      // const albumRef = doc(db, FCname.albums, input.albumId);
      // // Fetch the album document
      // const albumDoc = await getDoc(albumRef);
      // const songs: Song[] = [];
      // if (albumDoc.exists()) {
      //   // Access the "songs" array field from the document's data
      //   const songsArray = albumDoc.data().songs as string[];

      //   if (Array.isArray(songsArray)) {
      //     for (const songId of songsArray) {
      //       const songDoc = await getDoc(doc(db, FCname.songs, songId));
      //       if (songDoc.exists()) {
      //         const song = songDoc.data() as Song;
      //         songs.push(song);
      //       }
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
    .input(z.object({ songId: z.string() }))
    .query(async ({ input }) => {
      return {};
      // const docRef = doc(db, FCname.songs, input.songId);
      // const docSnap = await getDoc(docRef);
      // const song = docSnap.data();
      // return song && (song as Song);
    }),

  deleteAsong: protectedProcedure
    .input(z.object({ songId: z.string(), albumId: z.string() }))
    .mutation(async ({ input }) => {
      // const result = await runTransaction(db, async (transaction) => {
      //   // write to root songs
      //   // also add to albums
      //   const albumRef = doc(db, FCname.albums, input.albumId);
      //   // Read the current state of the album document
      //   const albumSnapshot = await transaction.get(albumRef);
      //   const albumData = albumSnapshot.data();
      //   const songIdToRemove = input.songId;
      //   const newDocRef = doc(db, FCname.songs, songIdToRemove); // Reference to the song to be deleted
      //   // Check if the song exists in the album's "songs" array
      //   if (albumData) {
      //     const songs = albumData.songs as string[];
      //     if (songs.includes(songIdToRemove)) {
      //       // Remove the song ID from the "songs" array using filter
      //       const updatedSongs = songs.filter(
      //         (songId: string) => songId !== songIdToRemove,
      //       );
      //       // Update the album's "songs" array
      //       transaction.update(albumRef, { songs: updatedSongs });
      //       // Delete the song document
      //       transaction.delete(newDocRef);
      //     }
      //   }
      //   return input.songId;
      // });
      // const docRef = doc(db, FCname.songs, input.songId);
      // await deleteDoc(docRef);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        artist: z.string(),
        albumId: z.string(),
        coverImgUrl: z.string().url(),
        musicUrl: z.string().url(),
        id: z.string(),
        duration: z.string(),
        edit: z.boolean(),
        serial: z.number().optional(),
        privacy: z.nativeEnum(SongPrivacy),
        asset: ZodSongAsset,
      }),
    )
    .mutation(async ({ input }) => {
      // try {
      //   const serialNumber = 1;
      //   const newSong: Song = {
      //     albumId: input.albumId,
      //     serialNumber: input.serial ? input.serial : 1,
      //     id: input.id,
      //     name: input.name,
      //     artist: input.artist,
      //     coverImgUrl: input.coverImgUrl,
      //     musicUrl: input.musicUrl,
      //     duration: input.duration,
      //     date: new Date(),
      //     privacy: input.privacy,
      //     views: 0,
      //   };
      //   if (input.edit) {
      //   }
      //   // Conditionally add description property
      //   // you can't firebase data fild to undefined
      //   // asset
      //   // issuer
      //   if (typeof input.asset !== "undefined") {
      //     newSong.songAsset = input.asset;
      //   }
      //   const result = await runTransaction(db, async (transaction) => {
      //     // write to root songs
      //     const newDocRef = doc(db, FCname.songs, input.id);
      //     // also add to albums
      //     let albumRef = doc(db, FCname.albums, input.albumId);
      //     // Read the current state of the album document
      //     const albumSnapshot = await transaction.get(albumRef);
      //     // Check if the album exists
      //     if (!albumSnapshot.exists()) {
      //       albumRef = doc(db, FCname.albums, "UNKOWN");
      //     }
      //     // Add the new ID to the "songs" array using arrayUnion
      //     const updateData = {
      //       songs: arrayUnion(input.id),
      //     };
      //     transaction.update(albumRef, updateData);
      //     // Create or update the new song document within the transaction
      //     transaction.set(newDocRef, newSong);
      //     return input.id;
      //   });
      //   return result;
      // } catch (e) {
      //   throw new TRPCError({
      //     code: "PARSE_ERROR",
      //     message: "Firebase error",
      //     // optional: pass the original error to retain stack trace
      //     cause: e,
      //   });
      // }
    }),

  saveToken: protectedProcedure
    .input(
      z.object({ songId: z.string(), pubKey: z.string(), secret: z.string() }),
    )
    .mutation(async ({ input }) => {
      // const songDocRef = doc(db, FCname.songs, input.songId);
      // const token = {
      //   publicKey: input.pubKey,
      //   secretKey: input.secret,
      // };
      // await updateDoc(songDocRef, { token: token });
    }),

  changeOrder: protectedProcedure
    .input(z.object({ ids: z.array(z.string()), albumId: z.string() }))
    .mutation(async ({ input }) => {
      // const collectionRef = collection(db, FCname.songs);
      // // Assuming you have a list of ordered song IDs from your drag-and-drop operation
      // const orderedIds = input.ids; // Replace with the new order of song IDs
      // const batch = writeBatch(db);
      // orderedIds.forEach((songId, newIndex) => {
      //   const songRef = doc(collectionRef, songId);
      //   batch.update(songRef, { serialNumber: newIndex + 1 });
      // });
      // await batch.commit();
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
