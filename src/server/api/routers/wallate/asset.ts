import { z } from "zod";
import { AdminAssetFormSchema } from "~/components/wallete/add_asset_form";
import { getRandomColorHex } from "colors-helper-tools";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { getBlurData } from "~/lib/serverUtils";

export const assetRouter = createTRPCRouter({
  getBancoinAssets: protectedProcedure
    .input(
      z.object({
        tag: z.string().optional(),
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, skip, cursor } = input;

      let whereClause = {};

      if (input.tag) {
        whereClause = {
          tags: {
            some: {
              tagName: input.tag,
            },
          },
        };
      }

      const items = await ctx.db.adminAsset.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        include: { tags: { select: { tagName: true } } },
        where: whereClause,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        assets: items,
        nextCursor,
      };
    }),
  addAsset: protectedProcedure
    .input(AdminAssetFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        code,
        tags,
        description,
        link,
        logoUrl,
        issuer,
        litemint,
        stellarterm,
        stellarx,
      } = input;

      const tagsArr = tags.split(",");
      const color = getRandomColorHex();
      const blurData = await getBlurData(logoUrl);

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
          code,
          color,
          logoBlueData: blurData,
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
          Litemint: litemint,
          StellarX: stellarx,
          StellarTerm: stellarterm,
        },
      });
    }),

  deleteAsset: adminProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.adminAsset.delete({
        where: {
          id: input,
        },
      });
    }),
});
