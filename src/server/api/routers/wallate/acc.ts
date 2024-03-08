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
  }),

  getCreatorStorageInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const creatorId = ctx.session.user.id;
    const storage = await ctx.db.creator.findUnique({
      where: { id: creatorId },
      select: { storagePub: true },
    });
    if (!storage?.storagePub) {
      throw new Error("storage does not exist");
    }

    return await accountDetailsWithHomeDomain({ userPub: storage.storagePub });
  }),
  isItemPlacedInMarket: protectedProcedure
    .input(z.object({ code: z.string(), issuer: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await ctx.db.marketAsset.findFirst({
        where: { asset: { code: input.code, issuer: input.issuer } },
      });

      if (asset && !asset.disabled) return true;

      return false;
    }),
});
