import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const creatorRouter = createTRPCRouter({
  getCreators: adminProcedure.query(async ({ ctx }) => {
    const creators = await ctx.db.creator.findMany({});
    return creators;
  }),

  deleteCreator: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.creator.delete({ where: { id: input } });
    }),

  creatorAction: adminProcedure
    .input(z.object({ status: z.boolean().nullable(), creatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { status, creatorId } = input;
      await ctx.db.creator.update({
        where: { id: creatorId },
        data: { approved: status },
      });
    }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
