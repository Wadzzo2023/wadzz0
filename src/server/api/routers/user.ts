import { z } from "zod";
import { UserAboutShema } from "~/components/fan/me/user-profile";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
  }),
  updateUserProfile: protectedProcedure
    .input(UserAboutShema)
    .mutation(async ({ ctx, input }) => {
      const { name, bio } = input;
      await ctx.db.user.update({
        data: { name, bio },
        where: { id: ctx.session.user.id },
      });
    }),

  changeUserProfilePicture: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        data: { image: input },
        where: { id: ctx.session.user.id },
      });
    }),
});
