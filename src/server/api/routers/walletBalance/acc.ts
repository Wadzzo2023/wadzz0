import { z } from "zod";
import { BalanceWithHomeDomain, NativeBalance } from "~/lib/stellar/walletBalance/acc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";


export const WBalanceRouter = createTRPCRouter({
  getWalletsBalance : protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await BalanceWithHomeDomain({userPub: userId});

  }),
  getNativeBalance : protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await NativeBalance({userPub: userId});
  }),

});
