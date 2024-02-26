import axios from "axios";
import {
  collection,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { z } from "zod";
import log from "~/lib/logger/logger";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

// Define a type for an NFT entry
interface NftEntry {
  nftId: string;
  copies: number;
}

// Define a type for the NFTs field in a user document
interface UserNfts {
  [nftId: string]: NftEntry;
}

export const userRouter = createTRPCRouter({
  addNft: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
        pubkey: z.string(),
        seller: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Use a Firestore transaction for atomic updates
      try {
        await runTransaction(db, async (transaction) => {
          const nftDocRef = doc(db, FSdocName.nfts, input.nftId);
          const docSnap = await transaction.get(nftDocRef);

          if (docSnap.exists()) {
            const originalDoc = docSnap.data() as NFT;

            // create new nft from oldDoc
            const {
              id,
              name,
              description,
              mediaUrl,
              thumbnailUrl,
              type,
              nftAsset,
              price,
            } = originalDoc;

            const newEntry: NFT = {
              id,
              name,
              description,
              mediaUrl,
              thumbnailUrl,
              type,
              copies: 0,
              original: false,
              nftAsset,
              price: price, // price same as prev
              privacy: NFTPrivacy.NOT_FOR_SALE,
              ownerAcc: input.pubkey,
              date: new Date(),
              views: 0,
            };

            const userNftCollectionRef = FScollectionRef.userNfts(input.pubkey); // customer
            const userDocRef = doc(userNftCollectionRef, input.nftId);

            const userDocSnapshot = await transaction.get(userDocRef);

            // update copies of original nft
            // there will be two case for original and for seller

            if (input.seller) {
              // get seller docs
              const sellerCollectionRef = FScollectionRef.userNfts(
                input.seller,
              ); // customer
              const sellerDocRef = doc(sellerCollectionRef, input.nftId);
              const sellerDocSnapshot = await transaction.get(sellerDocRef);
              if (sellerDocSnapshot.exists()) {
                const sellerNFT = sellerDocSnapshot.data() as NFT;
                // console.log("copies", sellerNFT.copies);
                transaction.update(sellerDocRef, {
                  copies: sellerNFT.copies - 1,
                });
              } else {
                console.log("seller acc not in firebase");
              }
            } else {
              // seller not given means it is original
              transaction.update(nftDocRef, { copies: originalDoc.copies - 1 });
            }

            if (userDocSnapshot.exists()) {
              // copies are not handling when user buying nft.
              // rather copies will be handled while user place it to marketplace.
              // const existingNfts = userDocSnapshot.data() as NFT;
              // existingNfts.copies += 1;
              // transaction.update(userDocRef, existingNfts);
            } else {
              transaction.set(userDocRef, newEntry);
            }
          } else {
            console.log("the nft does not exist");
          }
        });
      } catch (error) {
        console.error("Error during Firestore transaction:", error);
        // Handle the error appropriately, e.g., return an error response to the client
      }
    }),

  getUserNfts: publicProcedure
    .input(z.object({ pubkey: z.string().length(56) }))
    .query(async ({ input }) => {
      const userNftCollectionRef = FScollectionRef.userNfts(input.pubkey);
      // Get the user's document;
      const userNftDocs = await getDocs(userNftCollectionRef);
      return userNftDocs.docs.map((doc) => doc.data() as NFT);
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getUserSecret: publicProcedure
    .input(z.object({ uid: z.string(), email: z.string() }))
    .query(async ({ input }) => {
      const { email, uid } = input;
      const res = await axios.get(
        "https://accounts.action-tokens.com/api/getAccSecret",
        {
          params: {
            uid,
            email,
          },
        },
      );
      const secretKeySchema = z.object({
        secretKey: z.string().min(56),
      });

      const { secretKey } = await secretKeySchema.parseAsync(res.data);
      return secretKey;
    }),
});
