import { collection, getDocs, query, where } from "firebase/firestore";
import { z } from "zod";
import { getUserAllAssetsInSongAssets } from "~/lib/stellar/music/utils/asset";
import { SongPrivacy } from "~/lib/music/types/dbTypes";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const assetRouter = createTRPCRouter({
  getUserAssets: publicProcedure
    .input(z.object({ pubkey: z.string() }))
    .query(async ({ input }) => {
      const collectionRef = collection(db, FCname.songs);
      const uniqueSongAssets = new Set<string>();
      const querySnapshot = await getDocs(collectionRef);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const assetWithIssuer = data.assetWithIssuer as string;
        // Add the value to the Set to ensure uniqueness
        uniqueSongAssets.add(assetWithIssuer);
      });

      const assetInPublic = await getUserAllAssetsInSongAssets(
        input.pubkey,
        Array.from(uniqueSongAssets),
      );
      return assetInPublic;
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
