import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { AlbumFormShema } from "~/components/music/modal/album_create";

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
    .input(z.object({ albumId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.album.findUnique({ where: { id: input.albumId } });
    }),

  delete: adminProcedure
    .input(z.object({ albumId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.album.delete({ where: { id: input.albumId } });
    }),

  create: publicProcedure
    .input(AlbumFormShema)

    .mutation(async ({ input, ctx }) => {
      const { coverImgUrl, description, name } = input;
      await ctx.db.album.create({ data: { name, coverImgUrl, description } });
    }),

  update: protectedProcedure
    .input(AlbumFormShema)
    .mutation(async ({ input, ctx }) => {
      if (input.id) {
        const album = await ctx.db.album.findUnique({
          where: { id: input.id },
        });
        if (!album)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Album not found",
          });
        await ctx.db.album.update({
          where: { id: input.id },
          data: { ...input },
        });
      }
    }),
});
