import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const assetRouter = createTRPCRouter({
  getUserAssets: publicProcedure
    .input(z.object({ pubkey: z.string() }))
    .query(async ({ input }) => {
      return [];
    }),
});
