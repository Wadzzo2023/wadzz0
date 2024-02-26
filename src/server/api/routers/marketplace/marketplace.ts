import {
  DocumentData,
  Query,
  QueryDocumentSnapshot,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { MARKETPLACE_FILTER } from "~/components/marketplace/nfts/market_nfts";
import { NFT, NFTPrivacy } from "~/lib/marketplace/types/dbTypes";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export interface MarketNFT extends NFT {
  path: string;
}
export const marketRouter = createTRPCRouter({
  getAllNft: publicProcedure.query(async () => {
    const collectionRef = collectionGroup(db, FSdocName.nfts);

    const queryRef = query(collectionRef, limit(300));

    const querySnap = await getDocs(queryRef);
    const nfts = querySnap.docs.map((d) => {
      const doc = d.data() as MarketNFT;
      doc.path = d.ref.path;
      return doc;
    });
    return nfts;
  }),
  getMarketNft: publicProcedure
    .input(
      z.object({
        filter: z.nativeEnum(MARKETPLACE_FILTER).optional(),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const collectionRef = collectionGroup(db, FSdocName.nfts);
      const { filter } = input;
      const queryLimit = input.limit ?? 50;
      const { cursor } = input;

      let queryRef = query(
        collectionRef,
        where("privacy", "==", NFTPrivacy.FOR_SALE),
        orderBy("date"),
        limit(queryLimit),
      );

      if (cursor) {
        const lastVisible = await getDoc(doc(db, cursor));

        // console.log("cursor", typeof cursor);
        queryRef = query(
          collectionRef,
          where("privacy", "==", NFTPrivacy.FOR_SALE),
          orderBy("date"),
          startAfter(lastVisible),
          limit(queryLimit),
        );
      }

      if (filter) {
        queryRef = query(
          collectionRef,
          where("privacy", "==", NFTPrivacy.FOR_SALE),
          where("original", "==", filter == MARKETPLACE_FILTER.ORIGINAL),
        );
      }

      const querySnap = await getDocs(queryRef);
      const nfts = querySnap.docs.map((d) => {
        const doc = d.data() as MarketNFT;
        doc.path = d.ref.path;
        return doc;
      });

      const lastItemPath = nfts[nfts.length - 1]?.path;

      return { nfts, lastItemPath };
    }),

  searchMarketNFT: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const collectionRef = collectionGroup(db, FSdocName.nfts);

      const queryRef = query(
        collectionRef,
        where("privacy", "==", NFTPrivacy.FOR_SALE),
        where("name", ">=", input.query),
        where("name", "<=", input.query + "\uf8ff"),
      );
    }),

  revertNft2Market: publicProcedure
    .input(
      z.object({ pubkey: z.string(), nftId: z.string(), quantity: z.number() }),
    )
    .mutation(async ({ input }) => {
      // decreases user copies
      try {
        await runTransaction(db, async (transaction) => {
          const userNftCollectionRef = FScollectionRef.userNfts(input.pubkey);
          const userDocRef = doc(userNftCollectionRef, input.nftId);
          const userDocSnap = await transaction.get(userDocRef);
          if (userDocSnap.exists()) {
            const userNft = userDocSnap.data() as NFT;
            userNft.copies -= input.quantity;
            transaction.update(userDocRef, userNft);
          }
        });
      } catch (error) {
        console.error("Error during Firestore transaction:", error);
      }
    }),

  placeNft2Market: publicProcedure
    .input(
      z.object({
        pubkey: z.string(),
        copies: z.number(),
        price: z.string(),
        nftId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // increases user copies
      // update price
      // change privacy type to for sell.
      // user maynot be in db (in case user get this nft from other use. directly not buy from this site.)
      try {
        await runTransaction(db, async (transaction) => {
          const nftDocRef = doc(db, FSdocName.nfts, input.nftId);
          const nftSnap = await transaction.get(nftDocRef);
          if (nftSnap.exists()) {
            const nftData = nftSnap.data() as NFT;

            const userNftCollectionRef = FScollectionRef.userNfts(input.pubkey);
            const userDocRef = doc(userNftCollectionRef, input.nftId);
            const userDocSnap = await transaction.get(userDocRef);
            if (userDocSnap.exists()) {
              const userNft = userDocSnap.data() as NFT;
              userNft.copies += input.copies;
              userNft.price = input.price;
              userNft.privacy = NFTPrivacy.FOR_SALE;
              transaction.update(userDocRef, userNft);
            }
            // in case nft not buyed from this website
            else {
              const {
                id,
                name,
                description,
                mediaUrl,
                thumbnailUrl,
                type,
                nftAsset,
              } = nftData;

              const newEntry: NFT = {
                id,
                name,
                description,
                mediaUrl,
                thumbnailUrl,
                type,
                copies: input.copies,
                original: false,
                nftAsset,
                price: input.price, // price same as prev
                privacy: NFTPrivacy.FOR_SALE,
                ownerAcc: input.pubkey,
                date: new Date(),
                views: 0,
              };

              transaction.set(userDocRef, newEntry);
            }
          } else {
            console.log("firebase donot have original nft");
          }
        });
      } catch (error) {
        console.error("Error during Firestore transaction:", error);
      }
    }),
  getUserAssets: publicProcedure
    .input(z.object({ pubkey: z.string() }))
    .query(async ({ input }) => {
      const collectionRef = collection(db, FSdocName.nfts);
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
