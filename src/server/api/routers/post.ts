import { z } from "zod";
import { PostSchema } from "~/components/creator/CreatPost";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(PostSchema)
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          content: input.content,
          creatorId: input.id,
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
