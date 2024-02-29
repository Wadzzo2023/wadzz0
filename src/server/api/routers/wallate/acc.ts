import { z } from "zod";
import { accountDetailsWithHomeDomain } from "~/lib/stellar/marketplace/test/acc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const accRouter = createTRPCRouter({
  getAccountInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await accountDetailsWithHomeDomain({ userPub: userId });

    // what is  color blue,
    // now add this to db.
    // this include no token creation.
  }),
});
