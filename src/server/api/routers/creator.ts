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

  // getLatest: protectedProcedure.query(({ ctx }) => {
  //   return ctx.db.post.findFirst({
  //     orderBy: { createdAt: "desc" },
  //     where: { createdBy: { id: ctx.session.user.id } },
  //   });
  // }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
