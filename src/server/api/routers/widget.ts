import { z } from "zod";
import { ItemPrivacy } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Location } from "~/types/game/location";

export const widgetRouter = createTRPCRouter({
  getPublicLocations: publicProcedure
    .input(
      z
        .object({
          creatorIds: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Base query conditions
      const baseConditions = {
        approved: { equals: true },
        endDate: { gte: new Date() },
        subscriptionId: { equals: null },
        remaining: { gt: 0 },
      };

      // Add creator filter if creatorIds are provided
      const whereCondition = {
        ...baseConditions,
        ...(input?.creatorIds && input.creatorIds.length > 0
          ? {
              privacy: {
                in: [ItemPrivacy.PUBLIC, ItemPrivacy.PRIVATE, ItemPrivacy.TIER],
              },
              creatorId: { in: input.creatorIds },
            }
          : { privacy: { in: [ItemPrivacy.PUBLIC] } }),
      };

      const locationGroup = await ctx.db.locationGroup.findMany({
        where: whereCondition,
        include: {
          locations: true,
          creator: {
            include: {
              pageAsset: {
                select: {
                  code: true,
                  issuer: true,
                },
              },
            },
          },
        },
      });

      const pins = locationGroup
        .flatMap((group) => {
          const multiPin = group.multiPin;

          if (multiPin) {
            return group.locations.map((location) => ({
              ...location,
              ...group,
              id: location.id,
              collected: false,
            }));
          } else {
            return group.locations.map((location) => ({
              ...location,
              ...group,
              id: location.id,
              collected: false,
            }));
          }
        })
        .filter((location) => location !== undefined);

      const WadzzoIconURL = "https://app.wadzzo.com/images/loading.png";
      const locations: Location[] = pins.map((location) => {
        return {
          id: location.id,
          lat: location.latitude,
          lng: location.longitude,
          title: location.title,
          description: location.description ?? "No description provided",
          brand_name: location.creator.name,
          url: location.link ?? "https://wadzzo.com/",
          image_url:
            location.image ?? location.creator.profileUrl ?? WadzzoIconURL,
          collected: false,
          collection_limit_remaining: location.remaining,
          auto_collect: location.autoCollect,
          brand_image_url: location.creator.profileUrl ?? WadzzoIconURL,
          brand_id: location.creatorId,
          public: true,
        };
      });

      return { locations };
    }),
});
