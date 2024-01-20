import { z } from "zod";
import { schema } from "~/pages/me/creator";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(schema.merge(z.object({ pubkey: z.string() })))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          content: input.content,
          creatorId: input.pubkey,
          subscriptionId: 1,
        },
      });
    }),

  getPosts: protectedProcedure
    .input(z.object({ pubkey: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.post.findMany({
        where: {
          creatorId: input.pubkey,
        },
      });
    }),

  getSecretMessage: protectedProcedure.query(async ({ ctx }) => {
    return "secret message";
  }),
});
