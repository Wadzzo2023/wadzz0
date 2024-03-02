import { z } from "zod";
import { AdminAssetFormSchema } from "~/components/wallete/add_asset_form";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const assetRouter = createTRPCRouter({
  getAssets: protectedProcedure.query(async ({ ctx, input }) => {
    return await ctx.db.adminAsset.findMany();
  }),
  addAsset: protectedProcedure
    .input(AdminAssetFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { code, tags, description, link, logoUrl, issuer } = input;

      const tagsArr = tags.split(",");

      // adding all the tags
      await Promise.all(
        tagsArr.map(async (tagItem) => {
          const existingRecord = await ctx.db.tag.findUnique({
            where: { name: tagItem },
          });

          if (!existingRecord) {
            await ctx.db.tag.create({
              data: {
                name: tagItem,
              },
            });
          }
        }),
      );

      await ctx.db.adminAsset.create({
        data: {
          // code,
          // tags: { createMany: { data: [{}] } },
          tags: {
            createMany: {
              data: tagsArr.map((el) => ({ tagName: el })),
              skipDuplicates: true,
            },
          },

          codeIssuer: issuer,
          adminId: ctx.session.user.id,
          description,
          link,
          logoUrl,
          color: "red",
        },
      });

      // what is  color blue,
      // now add this to db.
      // this include no token creation.
    }),
});
