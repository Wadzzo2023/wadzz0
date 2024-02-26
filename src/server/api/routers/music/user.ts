import { z } from "zod";
import log from "~/lib/logger/logger";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  addSong: publicProcedure
    .input(z.object({ songId: z.string(), pubkey: z.string() }))
    .mutation(async ({ input }) => {
      const newUserData = {
        songs: arrayUnion(input.songId),
      };

      const userDocRef = doc(db, FCname.users, input.pubkey);

      // Check if the document exists
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        // The document exists, so update it
        await updateDoc(userDocRef, newUserData);
      } else {
        // The document doesn't exist, so create it
        await setDoc(userDocRef, newUserData);
      }
    }),

  getUserSongIds: publicProcedure
    .input(z.object({ pubkey: z.string().length(56) }))
    .query(async ({ input }) => {
      const userDocRef = doc(db, FCname.users, input.pubkey);
      // Get the user's document
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        // Access the songs array from the user's document data
        const userData = userDocSnapshot.data();
        const songs: string[] = (userData.songs as string[]) || []; // Default to an empty array if songs is not defined
        return songs;
      } else {
        log.info("User document does not exist.");
        return [] as string[];
      }
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
