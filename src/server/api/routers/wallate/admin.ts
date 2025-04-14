import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
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

  makeAdmin: adminProcedure
    .input(z.string().length(56))
    .mutation(async ({ input, ctx }) => {
      const id = input;
      await ctx.db.admin.create({ data: { id } });
    }),

  admins: adminProcedure.query(async ({ ctx }) => {
    const admins = await ctx.db.admin.findMany();
    return admins;
  }),
  deleteAdmin: adminProcedure
    .input(z.string().length(56))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.admin.delete({ where: { id: input } });
    }),
});
