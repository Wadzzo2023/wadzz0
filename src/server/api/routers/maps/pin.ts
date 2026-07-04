// ~/server/api/routers/pin.ts
//
// tRPC router for pin + hotspot management.
//
// Architecture:
//   Hotspot mutations  → hotspotClient  → Express /hotspots  → node-cron scheduler
//   Pin mutations      → Prisma DB directly (unchanged)
//   Agent queries      → taskClient.enqueue("agent_run", ...) → Express job queue
//
// QStash has been removed entirely.

import { ItemPrivacy } from "@prisma/client";
import { PinType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createOptimizedImage } from "~/server/image-optimizer";
import { createHotspotFormSchema } from "~/components/modals/create-hotspot-modal";
import { updateMapFormSchema } from "~/components/modals/pin-detail-modal";
import { hotspotClient } from "~/lib/express/hotspotClient-sdk";

import {
  adminProcedure,
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { PinLocation } from "~/types/pin";
import { BADWORDS } from "~/utils/banned-word";
import { fetchUsersByPublicKeys } from "~/utils/get-pubkey";
import {
  randomLocation as getLocationInLatLngRad,
} from "~/utils/map";

export type LocationWithConsumers = {
  title: string;
  description?: string;
  image?: string;
  startDate: Date;
  endDate: Date;
  approved?: boolean;
  latitude: number;
  longitude: number;
  consumers: number;
  autoCollect: boolean;
  id: string;
};

const PAGE_SIZE = 10;

export const createPinFormSchema = z.object({
  lat: z
    .number({ message: "Latitude is required" })
    .min(-180)
    .max(180),
  lng: z
    .number({ message: "Longitude is required" })
    .min(-180)
    .max(180),
  description: z.string(),
  title: z
    .string()
    .min(3)
    .refine((value) => !BADWORDS.some((word) => value.includes(word)), {
      message: "Input contains banned words.",
    }),
  image: z.string().url().optional(),
  startDate: z.date(),
  endDate: z
    .date()
    .min(new Date(new Date().setHours(0, 0, 0, 0)))
    .transform((date) => new Date(date.setHours(23, 59, 59, 999))),
  url: z.string().url().optional(),
  autoCollect: z.boolean(),
  token: z.number().optional(),
  tokenAmount: z.number().nonnegative().optional(),
  pinNumber: z.number().nonnegative().min(1),
  radius: z.number().nonnegative(),
  pinCollectionLimit: z.number().min(0),
  tier: z.string().optional(),
  multiPin: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
});

export const PAGE_ASSET_NUM = -10;
export const NO_ASSET = -99;

export const createAdminPinFormSchema = z.object({
  lat: z.number({ message: "Latitude is required" }).min(-180).max(180),
  lng: z.number({ message: "Longitude is required" }).min(-180).max(180),
  description: z.string(),
  title: z
    .string()
    .min(3)
    .refine((value) => !BADWORDS.some((word) => value.includes(word)), {
      message: "Input contains banned words.",
    }),
  image: z.string().url().optional(),
  startDate: z.date(),
  endDate: z.date().refine(
    (date) => {
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay >= new Date(new Date().setHours(0, 0, 0, 0));
    },
    { message: "End date must be today or later" }
  ),
  url: z.string().url().optional(),
  autoCollect: z.boolean(),
  token: z.number().optional(),
  tokenAmount: z.number().nonnegative().optional(),
  pinNumber: z.number().nonnegative().min(1),
  radius: z.number().nonnegative(),
  pinCollectionLimit: z.number().min(0),
  tier: z.string().optional(),
  multiPin: z.boolean().optional(),
  creatorId: z.string(),
  tags: z.array(z.string()).default([]),
});

export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  // ─── Hotspot mutations → Express task server ────────────────────────────────
  //
  // These no longer touch QStash or the cron scheduler directly.
  // They call hotspotClient which POSTs to the Express /hotspots API.
  // The Express server owns the node-cron scheduler lifecycle.

  createHotspot: creatorProcedure
    .input(createHotspotFormSchema.extend({ creatorId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = input.creatorId ?? ctx.session.user.id;

      try {
        const result = await hotspotClient.create(creatorId, {
          title: input.title,
          description: input.description,
          image: input.image,
          url: input.url,
          type: input.type,
          dropEveryDays: input.dropEveryDays,
          pinDurationDays: input.pinDurationDays,
          hotspotStartDate: input.hotspotStartDate.toISOString(),
          hotspotEndDate: input.hotspotEndDate.toISOString(),
          pinNumber: input.pinNumber,
          pinCollectionLimit: input.pinCollectionLimit,
          autoCollect: input.autoCollect,
          multiPin: input.multiPin,
          hotspotShape: input.hotspotShape,
          geoJson: input.geoJson,
          token: input.token,
          tier: input.tier,
          creatorId,
        });

        return { hotspotId: result.hotspotId };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to create hotspot",
        });
      }
    }),

  myHotspots: creatorProcedure.query(async ({ ctx }) => {
    return ctx.db.hotspot.findMany({
      where: { creatorId: ctx.session.user.id, hidden: false },
      select: {
        id: true,
        creatorId: true,
        isActive: true,
        dropEveryDays: true,
        pinDurationDays: true,
        hotspotStartDate: true,
        hotspotEndDate: true,
        shape: true,
        geoJson: true,
        autoCollect: true,
        multiPin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getHotspot: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
        select: {
          id: true,
          creatorId: true,
          isActive: true,
          dropEveryDays: true,
          pinDurationDays: true,
          hotspotStartDate: true,
          hotspotEndDate: true,
          shape: true,
          geoJson: true,
          autoCollect: true,
          multiPin: true,
          createdAt: true,
          updatedAt: true,
          locationGroups: {
            where: { hidden: false },
            orderBy: { startDate: "desc" },
            include: {
              locations: { include: { consumers: true } },
            },
          },
        },
      });
      return hotspot ?? null;
    }),

  pauseHotspotSchedule: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before delegating to Express
      const h = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
        select: { id: true },
      });
      if (!h) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        return await hotspotClient.pause(ctx.session.user.id, input.hotspotId);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to pause hotspot",
        });
      }
    }),

  resumeHotspotSchedule: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const h = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
        select: { id: true },
      });
      if (!h) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        return await hotspotClient.resume(
          ctx.session.user.id,
          input.hotspotId
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to resume hotspot",
        });
      }
    }),

  deleteHotspotCascade: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const h = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
        select: { id: true },
      });
      if (!h) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        return await hotspotClient.delete(
          ctx.session.user.id,
          input.hotspotId
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to delete hotspot",
        });
      }
    }),

  // ─── Pin mutations → Prisma DB directly (unchanged) ────────────────────────

  createPin: creatorProcedure
    .input(createPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { pinNumber, pinCollectionLimit, token, tier, multiPin } = input;

      let tierId: number | undefined;
      let privacy: ItemPrivacy = ItemPrivacy.PUBLIC;
      if (!tier || tier === "public") privacy = ItemPrivacy.PUBLIC;
      else if (tier === "private") privacy = ItemPrivacy.PRIVATE;
      else { tierId = Number(tier); privacy = ItemPrivacy.TIER; }

      let assetId = token;
      let pageAsset = false;
      if (token === PAGE_ASSET_NUM) { assetId = undefined; pageAsset = true; }

      const optimizedImage = input.image
        ? await createOptimizedImage(input.image).catch(() => null)
        : null;

      const locations = Array.from({ length: pinNumber }).map(() => {
        const loc = getLocationInLatLngRad(input.lat, input.lng, input.radius);
        return {
          autoCollect: input.autoCollect,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      });

      const locationGroup = await ctx.db.locationGroup.create({
        data: {
          creatorId: ctx.session.user.id,
          endDate: input.endDate,
          startDate: input.startDate,
          title: input.title,
          description: input.description,
          assetId,
          pageAsset,
          limit: pinCollectionLimit,
          image: input.image,
          optimizedImage,
          link: input.url,
          latitude: input.lat,
          longitude: input.lng,
          radius: input.radius,
          locations: { createMany: { data: locations } },
          subscriptionId: tierId,
          privacy,
          remaining: pinCollectionLimit,
          multiPin,
        },
      });
      if (input.tags && input.tags.length > 0) {
        await ctx.db.locationGroupTag.createMany({
          data: input.tags.map((tagId) => ({
            locationGroupId: locationGroup.id,
            tagId,
          })),
          skipDuplicates: true,
        })
      }
      return locationGroup;
    }),

  createForAdminPin: adminProcedure
    .input(createAdminPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { pinNumber, pinCollectionLimit, token, tier, multiPin, creatorId } = input;

      const creator = await ctx.db.creator.findUnique({ where: { id: creatorId } });
      if (!creator) throw new Error("Creator not found");

      let tierId: number | undefined;
      let privacy: ItemPrivacy = ItemPrivacy.PUBLIC;
      if (!tier || tier === "public") privacy = ItemPrivacy.PUBLIC;
      else if (tier === "private") privacy = ItemPrivacy.PRIVATE;
      else { tierId = Number(tier); privacy = ItemPrivacy.TIER; }

      let assetId = token;
      let pageAsset = false;
      if (token === PAGE_ASSET_NUM) { assetId = undefined; pageAsset = true; }
      const optimizedImage = input.image
        ? await createOptimizedImage(input.image).catch(() => null)
        : null;
      const locations = Array.from({ length: pinNumber }).map(() => {
        const loc = getLocationInLatLngRad(input.lat, input.lng, input.radius);
        return {
          autoCollect: input.autoCollect,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      });

      const locationGroup = await ctx.db.locationGroup.create({
        data: {
          creatorId,
          endDate: input.endDate,
          startDate: input.startDate,
          title: input.title,
          description: input.description,
          assetId,
          pageAsset,
          limit: pinCollectionLimit,
          image: input.image,
          optimizedImage,
          link: input.url,
          latitude: input.lat,
          longitude: input.lng,
          radius: input.radius,
          locations: { createMany: { data: locations } },
          subscriptionId: tierId,
          privacy,
          remaining: pinCollectionLimit,
          multiPin,
        },
      });
      if (input.tags && input.tags.length > 0) {
        await ctx.db.locationGroupTag.createMany({
          data: input.tags.map((tagId) => ({
            locationGroupId: locationGroup.id,
            tagId,
          })),
          skipDuplicates: true,
        })
      }
      return locationGroup;
    }),

  getPin: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const pin = await ctx.db.location.findUnique({
      where: { id: input },
      include: {
        locationGroup: {
          include: {
            creator: { select: { name: true, profileUrl: true } },
            locations: {
              include: {
                consumers: {
                  include: {
                    user: { select: { name: true, email: true, id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!pin) throw new Error("Pin not found");

    return {
      id: pin.id,
      title: pin.locationGroup?.title,
      description: pin.locationGroup?.description,
      image: pin.locationGroup?.image,
      startDate: pin.locationGroup?.startDate,
      endDate: pin.locationGroup?.endDate,
      url: pin.locationGroup?.link,
      autoCollect: pin.autoCollect,
      latitude: pin.latitude,
      longitude: pin.longitude,
      consumers:
        pin.locationGroup?.locations.flatMap((location) =>
          location.consumers.map((consumer) => ({
            pubkey: consumer.user.id,
            name: consumer.user.name ?? "Unknown",
            consumptionDate: consumer.createdAt,
          }))
        ) ?? [],
    };
  }),

  getPinM: creatorProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const pin = await ctx.db.location.findUnique({
        where: { id: input },
        include: {
          locationGroup: {
            include: {
              creator: { select: { name: true, profileUrl: true } },
              _count: { select: { locations: true } },
            },
          },
        },
      });
      if (!pin) throw new Error("Pin not found");

      return {
        id: pin.id,
        title: pin.locationGroup?.title,
        description: pin.locationGroup?.description ?? undefined,
        image: pin.locationGroup?.image,
        startDate: pin.locationGroup?.startDate,
        endDate: pin.locationGroup?.endDate,
        url: pin.locationGroup?.link,
        pinCollectionLimit: pin.locationGroup?.limit,
        pinNumber: pin.locationGroup?._count.locations,
        autoCollect: pin.autoCollect,
        lat: pin.latitude,
        lng: pin.longitude,
        token: pin.locationGroup?.pageAsset
          ? PAGE_ASSET_NUM
          : (pin.locationGroup?.subscriptionId ?? NO_ASSET),
        tier: pin.locationGroup?.subscriptionId,
      };
    }),

  updatePin: protectedProcedure
    .input(updateMapFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        pinId, lat, lng, description, title, image,
        startDate, endDate, url, pinRemainingLimit, autoCollect, multiPin,
      } = input;

      try {
        const findLocation = await ctx.db.location.findFirst({
          where: { id: pinId },
          include: { locationGroup: true },
        });
        if (!findLocation?.locationGroup) {
          throw new Error("Location or associated LocationGroup not found");
        }

        await ctx.db.location.update({
          where: { id: pinId },
          data: { latitude: lat, longitude: lng, autoCollect },
        });

        let updatedLimit = findLocation.locationGroup.limit;
        let updatedRemainingLimit = findLocation.locationGroup.remaining;
        if (typeof pinRemainingLimit === "number") {
          const limitDiff = pinRemainingLimit - findLocation.locationGroup.remaining;
          updatedLimit = updatedLimit + limitDiff;
          updatedRemainingLimit = pinRemainingLimit;
        }

        const imageChanged = image !== undefined && image !== findLocation.locationGroup.image;
        const optimizedImage = imageChanged
          ? await createOptimizedImage(image).catch(() => null)
          : undefined;

        return await ctx.db.locationGroup.update({
          where: { id: findLocation.locationGroup.id },
          data: {
            title, description, image, startDate, endDate,
            ...(optimizedImage !== undefined && { optimizedImage }),
            limit: updatedLimit, remaining: updatedRemainingLimit,
            link: url, multiPin,
          },
        });
      } catch (e) {
        console.error("Error updating location group:", e);
        throw new Error("Failed to update location group");
      }
    }),

  getMyPins: creatorProcedure
    .input(z.object({ showExpired: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const { showExpired = false } = input;
      const dateCondition = showExpired
        ? { endDate: { lte: new Date() } }
        : { endDate: { gte: new Date() } };

      return ctx.db.location.findMany({
        where: {
          locationGroup: {
            hidden: false,
            creatorId: ctx.session.user.id,
            ...dateCondition,
            OR: [{ approved: true }, { approved: null }],
          },
          hidden: false,
        },
        include: {
          _count: { select: { consumers: true } },
          locationGroup: {
            include: {
              creator: { select: { profileUrl: true } },
              locations: {
                select: {
                  locationGroup: {
                    select: {
                      endDate: true, startDate: true, limit: true,
                      image: true, description: true, title: true,
                      link: true, multiPin: true, subscriptionId: true,
                      pageAsset: true, privacy: true, remaining: true, assetId: true,
                    },
                  },
                  latitude: true, longitude: true, id: true, autoCollect: true,
                },
              },
            },
          },
        },
      });
    }),

  getCreatorPins: adminProcedure
    .input(z.object({ creator_id: z.string(), showExpired: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const { showExpired = false, creator_id } = input;
      const dateCondition = showExpired
        ? { endDate: { lte: new Date() } }
        : { endDate: { gte: new Date() } };

      return ctx.db.location.findMany({
        where: {
          locationGroup: {
            creatorId: creator_id,
            ...dateCondition,
            OR: [{ approved: true }, { approved: null }],
          },
        },
        include: {
          _count: { select: { consumers: true } },
          locationGroup: {
            include: {
              creator: { select: { profileUrl: true } },
              locations: {
                select: {
                  locationGroup: {
                    select: {
                      endDate: true, startDate: true, limit: true,
                      image: true, description: true, title: true,
                      link: true, multiPin: true, subscriptionId: true,
                      pageAsset: true, privacy: true, remaining: true, assetId: true,
                    },
                  },
                  latitude: true, longitude: true, id: true, autoCollect: true,
                },
              },
            },
          },
        },
      });
    }),

  getRangePins: creatorProcedure
    .input(z.object({
      northLatitude: z.number(),
      southLatitude: z.number(),
      eastLongitude: z.number(),
      westLongitude: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { northLatitude, southLatitude, eastLongitude, westLongitude } = input;
      return ctx.db.location.findMany({
        where: {
          locationGroup: {
            creatorId: ctx.session.user.id,
            endDate: { gte: new Date() },
            approved: { equals: true },
          },
          latitude: { gte: southLatitude, lte: northLatitude },
          longitude: { gte: westLongitude, lte: eastLongitude },
        },
        include: {
          _count: { select: { consumers: true } },
          locationGroup: { include: { creator: { select: { profileUrl: true } } } },
        },
      });
    }),

  getAdminLocationGroups: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.locationGroup.findMany({
      where: { approved: { equals: null }, endDate: { gte: new Date() }, hidden: false },
      include: {
        creator: { select: { name: true, id: true } },
        locations: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getApprovedLocationGroups: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.locationGroup.findMany({
      where: { approved: { equals: true }, endDate: { gte: new Date() }, hidden: false },
      include: {
        creator: { select: { name: true, id: true } },
        locations: { where: { hidden: false } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getPinsGrops: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.locationGroup.findMany({
      include: { locations: true },
    });
  }),

  approveLocationGroups: adminProcedure
    .input(z.object({ locationGroupIds: z.array(z.string()), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.locationGroup.updateMany({
        where: { id: { in: input.locationGroupIds } },
        data: { approved: input.approved },
      });
    }),

  getAUserConsumedPin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.locationConsumer.findMany({
      where: { userId: ctx.session.user.id },
      include: { location: { include: { locationGroup: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getCreatorPinThatConsumed: creatorProcedure.query(async ({ ctx }) => {
    return ctx.db.locationConsumer.findMany({
      where: { location: { locationGroup: { creatorId: ctx.session.user.id } } },
      include: {
        location: {
          select: {
            latitude: true, longitude: true,
            locationGroup: { select: { creator: true } },
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getCreatorPinTConsumedByUser: protectedProcedure
    .input(z.object({
      day: z.number().optional(),
      creatorId: z.string().optional(),
      isAdmin: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (input?.isAdmin) {
        const admin = await ctx.db.admin.findUnique({ where: { id: ctx.session.user.id } });
        if (!admin) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!input.creatorId) return;
      } else {
        const creator = await ctx.db.creator.findUnique({ where: { id: ctx.session.user.id } });
        if (!creator) throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const consumedLocations = await ctx.db.locationGroup.findMany({
        where: {
          creatorId: input?.creatorId,
          createdAt: input?.day
            ? { gte: new Date(Date.now() - input.day * 86_400_000) }
            : {},
        },
        select: {
          locations: {
            select: {
              id: true, latitude: true, longitude: true, autoCollect: true,
              _count: { select: { consumers: true } },
              consumers: {
                select: {
                  user: { select: { name: true, id: true, email: true } },
                  claimedAt: true,
                },
              },
            },
          },
          startDate: true, endDate: true, title: true, id: true, creatorId: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const usersPublicKeys = Array.from(new Set(
        consumedLocations.flatMap((group) =>
          group.locations.flatMap((location) =>
            location.consumers.map((consumer) => consumer.user.id)
          )
        )
      ));

      if (usersPublicKeys.length > 0) {
        const usersEmails = await fetchUsersByPublicKeys(usersPublicKeys);
        if (usersEmails.length > 0) {
          consumedLocations.forEach((group) => {
            group.locations.forEach((location) => {
              location.consumers.forEach((consumer) => {
                const user = usersEmails.find((u) => u.publicKey === consumer.user.id);
                consumer.user.email = user?.email ?? consumer.user.email ?? "Unknown";
              });
            });
          });
        }
      }

      return consumedLocations;
    }),

  downloadCreatorPinTConsumedByUser: protectedProcedure
    .input(z.object({ day: z.number().optional(), creatorId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!input.creatorId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Creator ID is required" });
      }

      const consumedLocations = await ctx.db.locationGroup.findMany({
        where: {
          creatorId: input.creatorId,
          createdAt: input.day
            ? { gte: new Date(Date.now() - input.day * 86_400_000) }
            : {},
        },
        select: {
          locations: {
            select: {
              id: true, latitude: true, longitude: true, autoCollect: true,
              _count: { select: { consumers: true } },
              consumers: {
                select: {
                  user: { select: { name: true, id: true, email: true } },
                  claimedAt: true,
                },
              },
            },
          },
          creatorId: true, startDate: true, endDate: true, title: true, id: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (consumedLocations.length > 0) {
        const usersPublicKeys = Array.from(new Set(
          consumedLocations.flatMap((group) =>
            group.locations.flatMap((location) =>
              location.consumers.map((consumer) => consumer.user.id)
            )
          )
        ));
        const usersEmails = await fetchUsersByPublicKeys(usersPublicKeys);
        if (usersEmails.length > 0) {
          consumedLocations.forEach((group) => {
            group.locations.forEach((location) => {
              location.consumers.forEach((consumer) => {
                const user = usersEmails.find((u) => u.publicKey === consumer.user.id);
                consumer.user.email = user?.email ?? consumer.user.email ?? "Unknown";
              });
            });
          });
        }
      }

      return consumedLocations;
    }),

  getCreatorCreatedPin: creatorProcedure.query(async ({ ctx }) => {
    const locatoinGroups = await ctx.db.locationGroup.findMany({
      where: { creatorId: ctx.session.user.id, hidden: false },
      include: { locations: { include: { _count: { select: { consumers: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return locatoinGroups.flatMap((group) =>
      group.locations.map((location) => ({
        title: group.title,
        description: group.description,
        image: group.image,
        startDate: group.startDate,
        endDate: group.endDate,
        approved: group.approved,
        ...location,
        consumers: location._count.consumers,
        createdAt: group.createdAt,
      } as LocationWithConsumers))
    );
  }),

  getAllConsumedLocation: adminProcedure
    .input(z.object({ day: z.number() }).optional())
    .query(async ({ ctx, input }) => {
      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: {
          createdAt: input
            ? { gte: new Date(Date.now() - input.day * 86_400_000) }
            : {},
        },
        include: {
          location: {
            select: {
              locationGroup: {
                select: {
                  title: true, creator: { select: { name: true } },
                  description: true, approved: true, id: true,
                },
              },
              latitude: true, longitude: true, id: true,
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return consumedLocations.map((consumer) => ({
        user: { name: consumer.user.name, email: consumer.user.email, id: consumer.user.id },
        location: {
          latitude: consumer.location.latitude,
          longitude: consumer.location.longitude,
          creator: { name: consumer.location.locationGroup?.creator.name },
          title: consumer.location.locationGroup?.title,
        },
        createdAt: consumer.createdAt,
        id: consumer.location.id,
      } as PinLocation));
    }),

  downloadAllConsumedLocation: creatorProcedure
    .input(z.object({ day: z.number() }).optional())
    .mutation(async ({ ctx, input }) => {
      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: {
          createdAt: input
            ? { gte: new Date(Date.now() - input.day * 86_400_000) }
            : {},
        },
        include: {
          location: {
            select: {
              locationGroup: {
                select: {
                  title: true, creator: { select: { name: true } },
                  description: true, approved: true, id: true,
                },
              },
              latitude: true, longitude: true, id: true,
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return consumedLocations.map((consumer) => ({
        user: { name: consumer.user.name, email: consumer.user.email, id: consumer.user.id },
        location: {
          latitude: consumer.location.latitude,
          longitude: consumer.location.longitude,
          creator: { name: consumer.location.locationGroup?.creator.name },
          title: consumer.location.locationGroup?.title,
        },
        createdAt: consumer.createdAt,
        id: consumer.location.id,
      } as PinLocation));
    }),

  downloadCreatorConsumedLocation: adminProcedure
    .input(z.object({ day: z.number() }).optional())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.locationConsumer.findMany({
        where: {
          createdAt: input
            ? { gte: new Date(Date.now() - input.day * 86_400_000) }
            : {},
        },
        include: {
          location: {
            select: {
              locationGroup: {
                select: { title: true, creator: { select: { name: true } } },
              },
              latitude: true, longitude: true,
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  claimAPin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const locationConsumer = await ctx.db.locationConsumer.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (locationConsumer.userId !== ctx.session.user.id) {
        throw new Error("You are not authorized");
      }
      return ctx.db.locationConsumer.update({
        data: { claimedAt: new Date() },
        where: { id: input.id },
      });
    }),

  toggleAutoCollect: protectedProcedure
    .input(z.object({ id: z.string(), isAutoCollect: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.location.update({
        where: { id: input.id },
        data: { autoCollect: input.isAutoCollect },
      });
    }),

  paste: protectedProcedure
    .input(z.object({ id: z.string(), lat: z.number(), long: z.number(), isCut: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const location = await ctx.db.location.findUnique({
        where: { id: input.id },
        include: { locationGroup: true },
      });
      if (!location) throw new Error("Location not found");

      if (ctx.session.user.id !== location.locationGroup?.creatorId) {
        const admin = await ctx.db.admin.findUnique({ where: { id: ctx.session.user.id } });
        if (!admin) throw new Error("You are not authorized to paste this pin");
      }

      if (input.isCut) {
        await ctx.db.location.update({
          where: { id: input.id },
          data: { latitude: input.lat, longitude: input.long },
        });
      } else {
        if (!location.locationGroup) throw new Error("Location group not found");
        await ctx.db.location.create({
          data: {
            autoCollect: location.autoCollect,
            latitude: input.lat,
            longitude: input.long,
            locationGroupId: location.locationGroup.id,
          },
        });
      }

      return { id: location.id, lat: input.lat, long: input.long };
    }),

  deletePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.db.admin.findUnique({ where: { id: ctx.session.user.id } });

      const items = await ctx.db.location.update({
        where: {
          id: input.id,
          ...(!isAdmin ? { locationGroup: { creatorId: ctx.session.user.id } } : {}),
        },
        data: { hidden: true },
      });
      return { item: items.id };
    }),

  deletePinForAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.location.update({
        where: { id: input.id },
        data: { hidden: true },
      });
      return { item: items.id };
    }),

  deleteLocationGroupForAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.locationGroup.update({
        where: { id: input.id },
        data: { hidden: true },
      });
      return { item: items.id };
    }),

  getMyCollectedPins: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).nullish(), cursor: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const cursor = input.cursor;

      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: { userId: ctx.session.user.id, hidden: false },
        include: { location: { include: { locationGroup: true } } },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor } } : {}),
      });

      let nextCursor: typeof cursor | undefined;
      if (consumedLocations.length > limit) {
        nextCursor = consumedLocations.pop()!.id;
      }

      return { items: consumedLocations, nextCursor };
    }),

  lookupRedeemCode: protectedProcedure
    .input(z.object({
      code: z.string().trim().toUpperCase().length(6),
      locationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const consumer = await ctx.db.locationConsumer.findUnique({
        where: { redeemCode: input.code },
        include: {
          user: { select: { name: true, image: true, email: true } },
          location: {
            include: {
              locationGroup: {
                select: {
                  id: true, title: true, description: true, image: true,
                  link: true, type: true, startDate: true, endDate: true,
                  creator: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (!consumer) return { status: "not_found" as const };

      if (consumer.locationId !== input.locationId) {
        return {
          status: "wrong_location" as const,
          actualLocation: {
            id: consumer.location.id,
            latitude: consumer.location.latitude,
            longitude: consumer.location.longitude,
            groupTitle: consumer.location.locationGroup?.title,
          },
        };
      }

      if (consumer.isRedeemed) {
        return {
          status: "already_redeemed" as const,
          redeemedAt: consumer.redeemedAt?.toISOString() ?? null,
          claimedAt: consumer.claimedAt?.toISOString() ?? null,
          user: consumer.user,
          location: consumer.location.locationGroup,
          locationData: { latitude: consumer.location.latitude, longitude: consumer.location.longitude },
        };
      }

      return {
        status: "pending" as const,
        claimedAt: consumer.claimedAt?.toISOString() ?? null,
        user: consumer.user,
        location: consumer.location.locationGroup,
        locationData: { latitude: consumer.location.latitude, longitude: consumer.location.longitude },
      };
    }),

  getLocationGroupsWithConsumers: protectedProcedure
    .input(z.object({
      cursor: z.string().optional(),
      search: z.string().optional(),
      type: z.enum(["LANDMARK", "EVENT"]).optional(),
      limit: z.number().min(1).max(50).default(PAGE_SIZE),
    }))
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { cursor, search, type, limit } = input;

      const where = {
        creatorId,
        hidden: false,
        type: type ? { equals: type } : { in: [PinType.LANDMARK, PinType.EVENT] },
        ...(search?.trim()
          ? { title: { contains: search.trim(), mode: "insensitive" as const } }
          : {}),
      };

      const total = await ctx.db.locationGroup.count({ where });
      const groups = await ctx.db.locationGroup.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          locations: {
            include: {
              consumers: {
                include: { user: { select: { name: true, image: true, email: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (groups.length > limit) {
        groups.pop();
        nextCursor = groups[groups.length - 1]?.id;
      }

      const items = groups
        .map((group) => {
          const allConsumers = group.locations.flatMap((l) => l.consumers);
          const latestConsumer = allConsumers.reduce<Date | null>((latest, c) => {
            const d = c.claimedAt ?? c.createdAt;
            return !latest || d > latest ? d : latest;
          }, null);

          return {
            id: group.id, title: group.title, description: group.description,
            image: group.image, link: group.link, type: group.type,
            startDate: group.startDate, endDate: group.endDate,
            limit: group.limit, remaining: group.remaining,
            totalConsumers: allConsumers.length,
            totalRedeemed: allConsumers.filter((c) => c.isRedeemed).length,
            latestConsumerAt: latestConsumer?.toISOString() ?? null,
            locations: group.locations.map((loc) => ({
              id: loc.id, latitude: loc.latitude, longitude: loc.longitude,
              consumers: loc.consumers.map((c) => ({
                id: c.id, redeemCode: c.redeemCode, isRedeemed: c.isRedeemed,
                redeemedAt: c.redeemedAt?.toISOString() ?? null,
                claimedAt: c.claimedAt?.toISOString() ?? null,
                user: c.user,
              })),
            })),
          };
        })
        .sort((a, b) => {
          if (!a.latestConsumerAt && !b.latestConsumerAt) return 0;
          if (!a.latestConsumerAt) return 1;
          if (!b.latestConsumerAt) return -1;
          return new Date(b.latestConsumerAt).getTime() - new Date(a.latestConsumerAt).getTime();
        });

      return { items, nextCursor, total };
    }),

  getRedeemedByCreator: protectedProcedure
    .input(z.object({
      cursor: z.string().optional(),
      search: z.string().optional(),
      type: z.enum(["LANDMARK", "EVENT"]).optional(),
      limit: z.number().min(1).max(50).default(PAGE_SIZE),
    }))
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { cursor, search, type, limit } = input;
      const searchTrim = search?.trim();

      const where = {
        isRedeemed: true,
        location: {
          locationGroup: {
            creatorId, hidden: false,
            type: type ? { equals: type } : { in: [PinType.LANDMARK, PinType.EVENT] },
          },
        },
        ...(searchTrim ? {
          OR: [
            { redeemCode: { contains: searchTrim, mode: "insensitive" as const } },
            { user: { name: { contains: searchTrim, mode: "insensitive" as const } } },
            { user: { email: { contains: searchTrim, mode: "insensitive" as const } } },
            { location: { locationGroup: { title: { contains: searchTrim, mode: "insensitive" as const } } } },
          ],
        } : {}),
      };

      const total = await ctx.db.locationConsumer.count({ where });
      const redeemed = await ctx.db.locationConsumer.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { redeemedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
          location: {
            include: {
              locationGroup: {
                select: {
                  id: true, title: true, description: true, image: true,
                  link: true, type: true, startDate: true, endDate: true,
                  creator: { select: { name: true, id: true, profileUrl: true } },
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (redeemed.length > limit) nextCursor = redeemed.pop()?.id;

      return {
        items: redeemed.map((c) => ({
          id: c.id, redeemCode: c.redeemCode,
          redeemedAt: c.redeemedAt?.toISOString() ?? null,
          claimedAt: c.claimedAt?.toISOString() ?? null,
          user: c.user, location: c.location.locationGroup,
          locationData: { latitude: c.location.latitude, longitude: c.location.longitude },
        })),
        nextCursor,
        total,
      };
    }),

  redeemByCode: publicProcedure
    .input(z.object({
      code: z.string().trim().toUpperCase().length(6, "Code must be exactly 6 characters"),
    }))
    .mutation(async ({ ctx, input }) => {
      const consumer = await ctx.db.locationConsumer.findUnique({
        where: { redeemCode: input.code },
        include: {
          user: { select: { name: true, image: true, email: true } },
          location: {
            include: {
              locationGroup: {
                select: {
                  id: true, title: true, description: true, image: true,
                  link: true, type: true, startDate: true, endDate: true,
                  creator: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (!consumer) return { status: "not_found" as const };

      if (consumer.isRedeemed) {
        return {
          status: "already_redeemed" as const,
          redeemedAt: consumer.redeemedAt?.toISOString() ?? null,
          user: consumer.user,
          location: consumer.location.locationGroup,
          locationData: { latitude: consumer.location.latitude, longitude: consumer.location.longitude },
        };
      }

      const updated = await ctx.db.locationConsumer.update({
        where: { id: consumer.id },
        data: { isRedeemed: true, redeemedAt: new Date() },
        include: {
          user: { select: { name: true, image: true, email: true } },
          location: {
            include: {
              locationGroup: {
                select: {
                  id: true, title: true, description: true, image: true,
                  link: true, type: true, startDate: true, endDate: true,
                  creator: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      return {
        status: "success" as const,
        redeemedAt: updated.redeemedAt?.toISOString() ?? null,
        user: updated.user,
        location: updated.location.locationGroup,
        locationData: { latitude: updated.location.latitude, longitude: updated.location.longitude },
      };
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const [general, landmark, event, hotspot] = await Promise.all([
      ctx.db.locationGroup.count({ where: { creatorId, hotspotId: null, type: PinType.OTHER } }),
      ctx.db.locationGroup.count({ where: { creatorId, hotspotId: null, type: PinType.LANDMARK } }),
      ctx.db.locationGroup.count({ where: { creatorId, hotspotId: null, type: PinType.EVENT } }),
      ctx.db.hotspot.count({ where: { creatorId } }),
    ]);
    return { general, landmark, event, hotspot };
  }),

  getLocationGroups: protectedProcedure
    .input(z.object({
      type: z.enum(["general", "landmark", "event"]),
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const pinTypeMap: Record<string, PinType> = {
        general: PinType.OTHER,
        landmark: PinType.LANDMARK,
        event: PinType.EVENT,
      };

      const groups = await ctx.db.locationGroup.findMany({
        where: {
          creatorId: ctx.session.user.id,
          hotspotId: null,
          type: pinTypeMap[input.type],
          ...(input.search ? { title: { contains: input.search, mode: "insensitive" } } : {}),
        },
        include: { locations: { include: { _count: { select: { consumers: true } } } } },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (groups.length > input.limit) nextCursor = groups.pop()!.id;

      return { groups, nextCursor };
    }),

  updateLocationGroup: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      image: z.string().optional(),
      link: z.string().optional(),
      hidden: z.boolean().optional(),
      remaining: z.number().optional(),
      multiPin: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const group = await ctx.db.locationGroup.findFirst({
        where: { id, creatorId: ctx.session.user.id },
      });
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      const imageChanged = data.image !== undefined && data.image !== group.image;
      const optimizedImage = imageChanged
        ? await createOptimizedImage(data.image!).catch(() => null)
        : undefined;

      return ctx.db.locationGroup.update({
        where: { id },
        data: { ...data, ...(optimizedImage !== undefined && { optimizedImage }) },
      });
    }),

  deleteLocationGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.locationGroup.findFirst({
        where: { id: input.id, creatorId: ctx.session.user.id },
      });
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      await ctx.db.locationGroup.update({ where: { id: input.id }, data: { hidden: true } });
      return { success: true };
    }),

  bulkDeleteLocationGroups: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.locationGroup.count({
        where: { id: { in: input.ids }, creatorId: ctx.session.user.id },
      });
      if (count !== input.ids.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Some groups do not belong to you" });
      }
      await ctx.db.locationGroup.updateMany({
        where: { id: { in: input.ids } },
        data: { hidden: true },
      });
      return { deleted: input.ids.length };
    }),

  deleteLocation: protectedProcedure
    .input(z.object({ locationId: z.string(), locationGroupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.locationGroup.findFirst({
        where: { id: input.locationGroupId, creatorId: ctx.session.user.id },
      });
      if (!group) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await ctx.db.location.update({ where: { id: input.locationId }, data: { hidden: true } });
      return { success: true };
    }),

  bulkDeleteLocations: protectedProcedure
    .input(z.object({ locationIds: z.array(z.string()).min(1), locationGroupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.locationGroup.findFirst({
        where: { id: input.locationGroupId, creatorId: ctx.session.user.id },
      });
      if (!group) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await ctx.db.location.updateMany({
        where: { id: { in: input.locationIds }, locationGroupId: input.locationGroupId },
        data: { hidden: true },
      });
      return { deleted: input.locationIds.length };
    }),

  getHotspots: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const hotspots = await ctx.db.hotspot.findMany({
        where: { creatorId: ctx.session.user.id, hidden: false },
        select: {
          id: true,
          creatorId: true,
          isActive: true,
          dropEveryDays: true,
          pinDurationDays: true,
          hotspotStartDate: true,
          hotspotEndDate: true,
          shape: true,
          geoJson: true,
          autoCollect: true,
          multiPin: true,
          createdAt: true,
          updatedAt: true,
          locationGroups: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              limit: true,
              remaining: true,
              hidden: true,
              locations: {
                select: {
                  id: true,
                  latitude: true,
                  longitude: true,
                  autoCollect: true,
                  _count: { select: { consumers: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (hotspots.length > input.limit) nextCursor = hotspots.pop()!.id;

      return { hotspots, nextCursor };
    }),

  toggleHotspotActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.id, creatorId: ctx.session.user.id },
        select: { id: true, isActive: true },
      });
      if (!hotspot) throw new TRPCError({ code: "NOT_FOUND", message: "Hotspot not found" });

      try {
        if (hotspot.isActive) {
          return await hotspotClient.pause(ctx.session.user.id, input.id);
        } else {
          return await hotspotClient.resume(ctx.session.user.id, input.id);
        }
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to toggle hotspot",
        });
      }
    }),

  deleteHotspotDropGroup: protectedProcedure
    .input(z.object({ locationGroupId: z.string(), hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
      });
      if (!hotspot) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await ctx.db.locationGroup.update({
        where: { id: input.locationGroupId },
        data: { hidden: true },
      });
      return { success: true };
    }),

  bulkDeleteHotspotDropGroups: protectedProcedure
    .input(z.object({ locationGroupIds: z.array(z.string()).min(1), hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
      });
      if (!hotspot) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await ctx.db.locationGroup.updateMany({
        where: { id: { in: input.locationGroupIds }, hotspotId: input.hotspotId },
        data: { hidden: true },
      });
      return { deleted: input.locationGroupIds.length };
    }),
});