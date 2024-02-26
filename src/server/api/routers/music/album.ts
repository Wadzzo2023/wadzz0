import { deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { deleteObject, ref } from "firebase/storage";
import { Album } from "~/lib/music/types/dbTypes";

export const albumRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    // const querySnapshot = await getDocs(firebaseCollection.albums);
    // const ablums = querySnapshot.docs.map((doc) => {
    //   return doc.data() as Album;
    // });
    // const snapAsset = await getDoc(doc(db, FCname.albums));
    // return ablums;
    return [];
  }),

  getById: publicProcedure
    .input(z.object({ albumId: z.string() }))
    .query(async ({ input }) => {
      // const docSnapshot = await getDoc(doc(db, FCname.albums, input.albumId));
      // return docSnapshot.data() as Album;
      return {} as Album;
    }),

  delete: protectedProcedure
    .input(z.object({ albumId: z.string() }))
    .mutation(async ({ input }) => {
      // await deleteDoc(doc(db, FCname.albums, input.albumId));
      // const storageRef1 = ref(storage, getAlbumBase(input.albumId));
      // await deleteObject(storageRef1);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        coverImgUrl: z.string(),
        id: z.string(),
        edit: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      // const newAlbum: Album = {
      //   id: input.id,
      //   name: input.name,
      //   description: input.description,
      //   coverImgUrl: input.coverImgUrl,
      // };
      // try {
      //   const newDocRef = doc(db, FCname.albums, input.id);
      //   await setDoc(newDocRef, newAlbum);
      //   return input.id;
      //   // const docSnapshot = await getDoc(newDocRef);
      //   // if (docSnapshot.exists() && input.edit) {
      //   //   await setDoc(newDocRef, newAlbum);
      //   //   return input.id;
      //   // } else {
      //   //   await setDoc(newDocRef, newAlbum);
      //   //   return input.id;
      //   // }
      // } catch (e) {
      //   throw new TRPCError({
      //     code: "PARSE_ERROR",
      //     message: "Id is already exists, so try another name",
      //     // optional: pass the original error to retain stack trace
      //     cause: e,
      //   });
      // }
    }),
});
