import { TRPCError } from "@trpc/server";

import { Keypair } from "stellar-sdk";
import { z } from "zod";
i;
import log from "~/lib/logger/logger";
import {
  MOTHER_SECRET,
  STORAGE_PUB,
  STORAGE_SECRET,
} from "~/lib/stellar/music/constant";
import {
  firstTransection,
  getAccBalance,
  getBalncesOfStorag,
} from "~/lib/stellar/music/trx/create_song_token";
import {
  secondTransection,
  secondTransectionForFbAndGoogleUser,
} from "~/lib/stellar/music/trx/payment_xdr";
import { Song } from "~/lib/music/types/dbTypes";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export type authDocType = {
  pubkey: string;
  secret: string;
};

export const stellarRouter = createTRPCRouter({
  getPaymentXDR: publicProcedure
    .input(
      z.object({
        pubkey: z.string(),
        assetCode: z.string(),
        issuerPub: z.string(),
        limit: z.string(),
        price: z.string().refine(
          (v) => {
            const n = Number(v);
            return !isNaN(n) && v?.length > 0 && n > 0;
          },
          { message: "Invalid number" },
        ),
        secret: z.string().min(56).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { limit, assetCode, issuerPub, pubkey, price, secret } = input;
      try {
        let xdr: string;
        if (secret) {
          xdr = await secondTransectionForFbAndGoogleUser({
            assetCode,
            issuerPub,
            userPub: pubkey,
            limit,
            price,
            secret,
          });
        } else {
          xdr = await secondTransection({
            assetCode,
            issuerPub,
            userPub: pubkey,
            price,
            limit,
          });
        }
        if (xdr) {
          return xdr;
        }
      } catch (e: any) {
        if (e.response) {
          log.info(e.response.detail);
        }
        if (e.message) {
          log.info(e.message);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Account may not be funded; please check and try again later.",
          // optional: pass the original error to retain stack trace
        });
      }
    }),

  // generateMusicAsset: protectedProcedure
  //   .input(
  //     z.object({
  //       pubkey: z.string(),
  //       code: z.string().min(2).max(12),
  //       limit: z.string().refine(
  //         (v) => {
  //           const n = Number(v);
  //           return !isNaN(n) && v?.length > 0 && n > 0;
  //         },
  //         { message: "Invalid number" },
  //       ),
  //     }),
  //   )
  //   .mutation(async ({ input }) => {
  //     return await firstTransection({
  //       assetCode: input.code,
  //       limit: input.limit,
  //       motherSecret: "",
  //       storageSecret: "",
  //     });
  //   }),

  getOrGeneratePub: publicProcedure
    .input(z.object({ uid: z.string() }))
    .query(async ({ input }) => {
      const docRef = doc(db, FCname.auth, input.uid);
      const userSnapshot = await getDoc(docRef);

      // Check if the album exists
      if (userSnapshot.exists()) {
        const userAuth = userSnapshot.data() as authDocType;
        return userAuth.pubkey;
      } else {
        const userPair = Keypair.random();
        const newDoc: authDocType = {
          pubkey: userPair.publicKey(),
          secret: userPair.secret(),
        };
        await setDoc(docRef, newDoc);

        return userPair.publicKey();
      }
    }),

  getToml: publicProcedure.query(async () => {
    const collectionRef = collection(db, FCname.songs);

    // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
    const q = query(collectionRef, orderBy("songAsset"));
    // Fetch the documents based on the query.
    const querySnapshot = await getDocs(q);
    const songs = querySnapshot.docs.map((doc) => {
      return doc.data() as Song;
    });

    // [DOCUMENTATION];
    // ORG_URL = "<https://music.bandcoin.io/>"[[CURRENCIES]];
    // issuer = "get asset issuer";
    // code = "get asset code";
    // name = "get asset name";
    // desc = "This is a description of the cool NFT.";
    // image = "ipfs link ending with file format extension";
    // limit = limit;
    // display_decimals = 7;

    for (const song of songs) {
    }
    return songs;
  }),

  getStorageBalances: publicProcedure.query(() => {
    return getAccBalance(STORAGE_PUB);
  }),

  getAccBalances: publicProcedure
    .input(z.object({ pub: z.string().min(56) }))
    .query(({ input }) => {
      return getAccBalance(input.pub);
    }),

  getSecrets: protectedProcedure.query(() => {
    return {
      STORAGE_SECRET,
      MOTHER_SECRET,
    };
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
