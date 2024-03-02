import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  checkAdmin: protectedProcedure.query(async ({ input, ctx }) => {
    const admin = await ctx.db.admin.findUnique({
      where: { id: ctx.session.user.id },
    });
    if (admin) {
      return admin;
    }
  }),
  makeMeAdmin: protectedProcedure.mutation(async ({ ctx }) => {
    const id = ctx.session.user.id;
    await ctx.db.admin.create({ data: { id } });
  }),
});
