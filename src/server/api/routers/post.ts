import { z } from "zod";
import { schema } from "~/pages/me/creator";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure.input(schema).mutation(async ({ ctx, input }) => {
    // simulate a slow db call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return ctx.db.post.create({
      data: {
        content: input.content,
        creatorId: ctx.session.user.id,
        subscriptionId: 1,
        // createdBy: { connect: { id: ctx.session.user.id } },
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
