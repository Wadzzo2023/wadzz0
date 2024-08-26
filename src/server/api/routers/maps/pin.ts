import { z } from "zod";
import {
  NO_ASSET,
  PAGE_ASSET_NUM,
  createPinFormSchema,
} from "~/components/maps/modals/create-pin";

import {
  adminProcedure,
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { PinLocation } from "~/types/pin";
import { randomLocation as getLocationInLatLngRad } from "~/utils/map";

export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  createPin: creatorProcedure
    .input(createPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        radius,
        pinNumber,
        pinCollectionLimit,
        tokenAmount: totalTokenAmount,
        token: tokenId,
        image,
        url,
        tier,
      } = input;

      const tierId = tier ? Number(tier) : undefined;

      let assetId = tokenId;
      let pageAsset: boolean;

      if (tokenId == PAGE_ASSET_NUM) {
        assetId = undefined;
        pageAsset = true;
      }

      let claimAmount: number | undefined = undefined;
      if (totalTokenAmount) {
        const amountPerPin = totalTokenAmount / pinNumber;
        claimAmount = amountPerPin / pinCollectionLimit;
      }

      const locations = Array.from({ length: pinNumber }).map(() => {
        const randomLocatin = getLocationInLatLngRad(
          input.lat,
          input.lng,
          input.radius,
        );
        return {
          claimAmount,
          assetId,
          pageAsset: pageAsset,
          image,
          autoCollect: input.autoCollect,
          limit: input.pinCollectionLimit,
          endDate: input.endDate,
          latitude: randomLocatin.latitude,
          longitude: randomLocatin.longitude,
          title: input.title,
          creatorId: ctx.session.user.id,
          isActive: true,
          startDate: input.startDate,
          description: input.description,
          link: url,
        };
      });

      await ctx.db.locationGroup.create({
        data: {
          creatorId: ctx.session.user.id,
          locations: {
            createMany: {
              data: locations,
            },
          },
        },
      });
    }),

  getMyPins: creatorProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.location.findMany({
      where: {
        creatorId: ctx.session.user.id,
        endDate: { gte: new Date() },
        approved: { equals: true },
      },
      include: {
        _count: { select: { consumers: true } },
        creator: { select: { profileUrl: true } },
      },
    });

    return pins;
  }),

  getPins: adminProcedure.query(async ({ ctx, input }) => {
    const pins = await ctx.db.location.findMany({
      where: { approved: { equals: null }, endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    return pins;
  }),

  getPinsGrops: adminProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.locationGroup.findMany({
      include: { locations: true },
    });

    return pins;
  }),

  approvePins: adminProcedure
    .input(z.object({ pins: z.array(z.number()), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.location.updateMany({
        where: {
          id: {
            in: input.pins,
          },
        },
        data: {
          approved: input.approved,
        },
      });
    }),

  getAUserConsumedPin: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const consumedLocations = await ctx.db.locationConsumer.findMany({
      where: {
        userId,
      },
      include: { location: true },
      orderBy: { createdAt: "desc" },
    });
    return consumedLocations;
  }),

  getCreatorPinThatConsumed: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const consumedLocations = await ctx.db.locationConsumer.findMany({
      where: {
        location: {
          creatorId,
        },
      },
      include: {
        location: {
          select: {
            title: true,
            latitude: true,
            longitude: true,
            creator: { select: { name: true } },
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return consumedLocations as PinLocation[];
  }),
  getCreatorCreatedPin: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const createdLocations = await ctx.db.location.findMany({
      where: {
        creatorId,
      },
      orderBy: { createdAt: "desc" },
    });
    return createdLocations;
  }),

  getAllConsumedLocation: adminProcedure
    .input(z.object({ day: z.number() }).optional())
    .query(async ({ ctx, input }) => {
      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: {
          createdAt: input
            ? {
                gte: new Date(
                  new Date().getTime() - input.day * 24 * 60 * 60 * 1000,
                ),
              }
            : {},
        },
        include: {
          location: {
            select: {
              title: true,
              latitude: true,
              longitude: true,
              creator: { select: { name: true } },
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return consumedLocations as PinLocation[];
    }),

  downloadAllConsumedLocation: creatorProcedure
    .input(z.object({ day: z.number() }).optional())
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: {
          createdAt: input
            ? {
                gte: new Date(
                  new Date().getTime() - input.day * 24 * 60 * 60 * 1000,
                ),
              }
            : {},
          location: {
            creatorId,
          },
        },
        include: {
          location: {
            select: {
              title: true,
              latitude: true,
              longitude: true,
              creator: { select: { name: true } },
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return consumedLocations as PinLocation[];
    }),

  downloadCreatorConsumedLocation: adminProcedure
    .input(z.object({ day: z.number() }).optional())
    .mutation(async ({ ctx, input }) => {
      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: {
          createdAt: input
            ? {
                gte: new Date(
                  new Date().getTime() - input.day * 24 * 60 * 60 * 1000,
                ),
              }
            : {},
        },
        include: {
          location: {
            select: {
              title: true,
              latitude: true,
              longitude: true,
              creator: { select: { name: true } },
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return consumedLocations as PinLocation[];
    }),

  claimAPin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const locationConsumer = await ctx.db.locationConsumer.findUniqueOrThrow({
        where: { id },
      });

      if (locationConsumer.userId != ctx.session.user.id)
        throw new Error("You are not authorized");

      return await ctx.db.locationConsumer.update({
        data: { claimedAt: new Date() },
        where: { id },
      });
    }),
  toggleAutoCollect: protectedProcedure
    .input(z.object({ id: z.number(), isAutoCollect: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.location.update({
        where: { id: input.id },
        data: { autoCollect: input.isAutoCollect },
      });
    }),

  paste: publicProcedure
    .input(
      z.object({
        id: z.number(),
        lat: z.number(),
        long: z.number(),
        isCut: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const location = await ctx.db.location.findUnique({
        where: { id: input.id },
      });
      if (!location) throw new Error("Location not found");

      const { lat, long } = input;
      if (ctx.session?.user.id != location.creatorId)
        throw new Error("You are not the creator of this pin");
      if (input.isCut) {
        await ctx.db.location.update({
          where: { id: input.id },
          data: { latitude: lat, longitude: long },
        });
      } else {
        await ctx.db.location.create({
          data: {
            claimAmount: location.claimAmount,
            assetId: location.assetId,
            pageAsset: location.pageAsset,
            image: location.image,
            autoCollect: location.autoCollect,
            limit: location.limit,
            endDate: location.endDate,
            latitude: lat,
            longitude: long,
            title: location.title,
            creatorId: ctx.session?.user.id,
            isActive: true,
            startDate: location.startDate,
            description: location.description,
          },
        });
      }

      return {
        id: location.id,
        lat,
        long,
      };
    }),

  deletePin: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.location.delete({
        where: { id: input.id, creatorId: ctx.session.user.id },
      });
      return {
        item: items.id,
      };
    }),
});
