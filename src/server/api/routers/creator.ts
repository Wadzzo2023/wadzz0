import { z } from "zod";
import { schema } from "~/pages/me/creator";

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
        return true;
      }

      return false;
    }),

  makeMeCreator: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.db.creator.create({
        data: { user: { connect: { id: input.id } } },
      });
    }),

  create: protectedProcedure.input(schema).mutation(async ({ ctx, input }) => {
    // simulate a slow db call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return ctx.db.post.create({
      data: {
        content: input.content,
        creatorId: ctx.session.user.id,
        subscriptionId: 1,
        // creator: { connect: { id: ctx.session.user.id } },
      },
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
