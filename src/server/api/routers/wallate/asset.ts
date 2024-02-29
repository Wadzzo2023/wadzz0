import { z } from "zod";
import { AdminAssetFormSchema } from "~/components/wallete/add_asset_form";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const assetRouter = createTRPCRouter({
  addAsset: adminProcedure
    .input(AdminAssetFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { code, tags, description, link, logoUrl, issuer } = input;
      // what is  color blue,
      // now add this to db.
      // this include no token creation.
    }),
});
