import { z } from "zod";
import {
  NFT,
  NFTIssuerPrivateInfo,
  NFTPrivacy,
  NFTType,
  ZodNFTAsset,
} from "~/lib/marketplace/types/dbTypes";

import log from "~/lib/logger/logger";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { MarketNFT } from "./marketplace";

export const nftRouter = createTRPCRouter({
  getAllNft: publicProcedure.query(async () => {
    // const collectionRef = collection(db, FSdocName.nfts);
    // const querySnapshot = await getDocs(collectionRef);
    // const nfts = querySnapshot.docs.map((doc) => {
    //   const docD = doc.data() as MarketNFT;
    //   docD.path = doc.ref.path;
    //   return docD;
    // });
    // return nfts;
    return [];
  }),

  deleteNFT: protectedProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ input }) => {
      // const docRef = doc(db, input.path);
      // try {
      //   await deleteDoc(docRef);
      // } catch (e: unknown) {
      //   console.log("delete error");
      // }

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
      // const songLimit = input.limit ? input.limit : 6;
      // const orderby = input.orderBy;

      // const collectionRef = collection(db, FSdocName.nfts);

      // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
      // const q = query(collectionRef, orderBy(input.orderBy), limit(songLimit));
      // // Fetch the documents based on the query.
      // const querySnapshot = await getDocs(q);
      // const songs = querySnapshot.docs.map((doc) => {
      //   return doc.data() as NFT;
      // });
      // return songs;

      return [];
    }),

  getAllSongsByPrivacy: publicProcedure
    .input(z.object({ privacy: z.nativeEnum(NFTPrivacy) }))
    .query(async ({ input }) => {
      // const collectionRef = collection(db, FSdocName.nfts);

      // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
      // const q = query(collectionRef, where("privacy", "==", input.privacy));
      // // Fetch the documents based on the query.
      // const querySnapshot = await getDocs(q);
      // const songs = querySnapshot.docs.map((doc) => {
      //   return doc.data() as NFT;
      // });
      // return songs;

      return [];
    }),

  getAllSongsWithAssetCode: publicProcedure.query(async () => {
    // const collectionRef = collection(db, FSdocName.nfts);

    // // Create a query that orders the documents by views in descending order and limits the result to a specific number (e.g., 10).
    // const q = query(collectionRef, orderBy("songAsset"));
    // // Fetch the documents based on the query.
    // const querySnapshot = await getDocs(q);
    // const songs = querySnapshot.docs.map((doc) => {
    //   return doc.data() as NFT;
    // });
    // return songs;

    return [];
  }),

  getUserBuyedSongs: publicProcedure
    .input(z.object({ pubkey: z.string().length(56) }))
    .query(async ({ input }) => {
      // const collectionRef = collection(db, FSdocName.nfts);

      // const userDocRef = doc(db, FSdocName.users, input.pubkey);
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
      //   return doc.data() as NFT;
      // });
      // return songs;

      return [];
    }),

  getAsong: publicProcedure
    .input(z.object({ songId: z.string() }))
    .query(async ({ input }) => {
      // const docRef = doc(db, FSdocName.nfts, input.songId);
      // const docSnap = await getDoc(docRef);
      // const song = docSnap.data();
      // return song && (song as NFT);

      return [];
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        thumbnailUrl: z.string().url(),
        description: z.string(),
        mediaUrl: z.string().url(),
        id: z.string(),
        edit: z.boolean(),
        path: z.string().optional(),
        issuerSecretInfo: z
          .object({ code: z.string(), pub: z.string(), secret: z.string() })
          .optional(),
        privacy: z.nativeEnum(NFTPrivacy),
        asset: ZodNFTAsset,
        type: z.nativeEnum(NFTType),
        copies: z.number(),
        price: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // const newNFT: NFT = {
      //   price: input.price,
      //   nftAsset: input.asset,
      //   copies: input.copies,
      //   original: true,
      //   id: input.id,
      //   type: input.type,
      //   name: input.name,
      //   thumbnailUrl: input.thumbnailUrl,
      //   mediaUrl: input.mediaUrl,
      //   date: new Date(),
      //   privacy: input.privacy,
      //   views: 0,
      //   description: input.description,
      // };
      // const batch = writeBatch(db);
      // if (input.edit) {
      //   // edit the docs
      //   const updateField = {
      //     name: input.name,
      //     price: input.price,
      //     privacy: input.privacy,
      //     description: input.description,
      //   };
      //   if (input.path) {
      //     const docRef = doc(db, input.path);
      //     batch.update(docRef, updateField);
      //     await batch.commit();
      //   }
      //   return newNFT.id;
      // } else {
      //   // write new nft doc.
      //   if (input.issuerSecretInfo) {
      //     // write to another doc for private key
      //     const newIssuerSecretInfo: NFTIssuerPrivateInfo =
      //       input.issuerSecretInfo;
      //     const newIssuerDocRef = doc(db, FSdocName.issuerSecret, input.id);
      //     batch.set(newIssuerDocRef, newIssuerSecretInfo);
      //   }
      //   // Conditionally add asset property
      //   // you can't firebase data fild to undefined
      //   // asset
      //   // write to root nfts
      //   const newNftDocRef = doc(db, FSdocName.nfts, input.id);
      //   batch.set(newNftDocRef, newNFT);
      //   type TomlData = {
      //     code: string;
      //     name: string;
      //     issuer: string;
      //     ipfs: string;
      //   };
      //   const tomlDocRef = firebaseDoc.toml;
      //   const { code, ipfs, issuer } = input.asset;
      //   const tomlData: TomlData = {
      //     code,
      //     issuer: issuer.pub,
      //     ipfs,
      //     name: input.name,
      //   };
      //   const data: TomlDataMap = {
      //     [`${code}-${issuer.pub}`]: tomlData,
      //   };
      //   batch.update(tomlDocRef, data);
      //   await batch.commit();
      //   return newNFT.id;
      // }
    }),

  saveToken: protectedProcedure
    .input(
      z.object({ songId: z.string(), pubKey: z.string(), secret: z.string() }),
    )
    .mutation(async ({ input }) => {
      // const songDocRef = doc(db, FSdocName.nfts, input.songId);
      // const token = {
      //   publicKey: input.pubKey,
      //   secretKey: input.secret,
      // };
      // await updateDoc(songDocRef, { token: token });
    }),

  getToml: publicProcedure.query(async () => {
    // const tomlSnap = await getDoc(firebaseDoc.toml);
    // const tomlmap = tomlSnap.data() as TomlDataMap;
    // return tomlmap;
  }),

  writeOldNft2toml: protectedProcedure.mutation(async () => {
    // const querySnap = await getDocs(FScollectionRef.originalNfts);
    // const nfts = querySnap.docs.map((doc) => doc.data() as NFT);
    // for (const nft of nfts) {
    //   const { code, issuer, ipfs } = nft.nftAsset;
    //   const tomlData: TomlData = {
    //     code,
    //     issuer: issuer.pub,
    //     ipfs,
    //     name: nft.name,
    //   };
    //   const data: TomlDataMap = {
    //     [`${code}-${issuer.pub}`]: tomlData,
    //   };
    //   const tomlDocRef = firebaseDoc.toml;
    //   await updateDoc(tomlDocRef, data);
    // }
  }),
});

export interface TomlData {
  code: string;
  issuer: string; // or some other type
  ipfs: string; // or some other type
  name: string; // or some other type
}

export type TomlDataMap = Record<string, TomlData>;
