import { z } from "zod";
import { CreatorAboutShema } from "~/components/creator/about";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const creatorRouter = createTRPCRouter({
  getCreator: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const creator = await ctx.db.creator.findFirst({
        where: { id: input.id },
      });
      if (creator) {
        return creator;
      }
    }),

  makeMeCreator: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.db.creator.create({
        data: {
          name: "test user",
          bio: "test",
          user: { connect: { id: input.id } },
        },
      });
    }),

  updateCreatorProfile: protectedProcedure
    .input(CreatorAboutShema)
    .mutation(async ({ ctx, input }) => {
      const { name, description, id } = input;
      await ctx.db.creator.update({
        data: { name, bio: description },
        where: { id },
      });
    }),

  getAllCreator: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.creator.findMany();
  }),

  // getLatest: protectedProcedure.query(({ ctx }) => {
  //   return ctx.db.post.findFirst({
  //     orderBy: { createdAt: "desc" },
  //     where: { createdBy: { id: ctx.session.user.id } },
  //   });
  // }),

  changeCreatorProfilePicture: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.creator.update({
        data: { profileUrl: input },
        where: { id: ctx.session.user.id },
      });
    }),

  changeCreatorCoverPicture: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.creator.update({
        data: { coverUrl: input },
        where: { id: ctx.session.user.id },
      });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  search: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return await ctx.db.creator.findMany({
      where: {
        OR: [
          {
            name: {
              contains: input,
              mode: "insensitive",
            },
          },
          {
            bio: {
              contains: input,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }),
});
