import { ItemPrivacy, PrismaClient } from "@prisma/client";
import { PinType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createHotspotFormSchema } from "~/components/modals/create-hotspot-modal";
import { updateMapFormSchema } from "~/components/modals/pin-detail-modal";
import { BASE_URL } from "~/lib/common";
import { qstash } from "~/lib/qstash";


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
import { dropIntervalToCron, generateRandomLocations, randomLocation as getLocationInLatLngRad } from "~/utils/map";
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
    .number({
      message: "Latitude is required",
    })
    .min(-180)
    .max(180),
  lng: z
    .number({
      message: "Longitude is required",
    })
    .min(-180)
    .max(180),
  description: z.string(),
  title: z
    .string()
    .min(3)
    .refine(
      (value) => {
        return !BADWORDS.some((word) => value.includes(word));
      },
      {
        message: "Input contains banned words.",
      },
    ),
  image: z.string().url().optional(),
  startDate: z.date(),
  endDate: z.date()
    .min(new Date(new Date().setHours(0, 0, 0, 0))) // Prevent past dates
    .transform((date) => new Date(date.setHours(23, 59, 59, 999))),
  url: z.string().url().optional(),
  autoCollect: z.boolean(),
  token: z.number().optional(),
  tokenAmount: z.number().nonnegative().optional(), // if it optional then no token selected
  pinNumber: z.number().nonnegative().min(1),
  radius: z.number().nonnegative(),
  pinCollectionLimit: z.number().min(0),
  tier: z.string().optional(),
  multiPin: z.boolean().optional(),
});
export const PAGE_ASSET_NUM = -10
export const NO_ASSET = -99
export const createAdminPinFormSchema = z.object({
  lat: z
    .number({
      message: "Latitude is required",
    })
    .min(-180)
    .max(180),
  lng: z
    .number({
      message: "Longitude is required",
    })
    .min(-180)
    .max(180),
  description: z.string(),
  title: z
    .string()
    .min(3)
    .refine(
      (value) => {
        return !BADWORDS.some((word) => value.includes(word))
      },
      {
        message: "Input contains banned words.",
      },
    ),
  image: z.string().url().optional(),
  startDate: z.date(),
  endDate: z.date().refine(
    (date) => {
      // Set the time to the end of the day for comparison
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      return endOfDay >= new Date(new Date().setHours(0, 0, 0, 0))
    },
    {
      message: "End date must be today or later",
    },
  ),
  url: z.string().url().optional(),
  autoCollect: z.boolean(),
  token: z.number().optional(),
  tokenAmount: z.number().nonnegative().optional(), // if it optional then no token selected
  pinNumber: z.number().nonnegative().min(1),
  radius: z.number().nonnegative(),
  pinCollectionLimit: z.number().min(0),
  tier: z.string().optional(),
  multiPin: z.boolean().optional(),
  creatorId: z.string(),
})
export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  createHotspot: creatorProcedure
    .input(createHotspotFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { token, tier, pinCollectionLimit, pinNumber, autoCollect,
        dropEveryDays, pinDurationDays, hotspotStartDate, hotspotEndDate,
        hotspotShape, geoJson } = input
      const creatorId = ctx.session.user.id
      // Resolve privacy & tier
      let tierId: number | undefined
      let privacy: ItemPrivacy = ItemPrivacy.PUBLIC
      if (!tier || tier === "public") { privacy = ItemPrivacy.PUBLIC }
      else if (tier === "private") { privacy = ItemPrivacy.PRIVATE }
      else { tierId = Number(tier); privacy = ItemPrivacy.TIER }

      // Resolve asset
      let assetId: number | undefined = token
      let pageAsset = false
      if (token === PAGE_ASSET_NUM) { assetId = undefined; pageAsset = true }

      const now = new Date()
      const firstDropEnd = new Date(now.getTime() + pinDurationDays * 86_400_000)

      // Single write: Hotspot + first LocationGroup + first Locations
      const hotspot = await ctx.db.hotspot.create({
        data: {
          creatorId: creatorId,
          autoCollect,
          dropEveryDays,
          pinDurationDays,
          hotspotStartDate,
          hotspotEndDate,
          shape: hotspotShape,
          geoJson,
          isActive: true,
          locationGroups: {
            create: {
              creatorId: creatorId,
              title: input.title,
              description: input.description,
              image: input.image,
              link: input.url,
              type: input.type,
              privacy,
              multiPin: input.multiPin,
              assetId,
              pageAsset,
              limit: pinCollectionLimit,
              remaining: pinCollectionLimit,
              subscriptionId: tierId,
              startDate: now,
              endDate: firstDropEnd,
              approved: true,
              locations: {
                createMany: {
                  data: generateRandomLocations(hotspotShape, geoJson, pinNumber)
                    .map((loc) => ({
                      autoCollect,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                    })),
                },
              },
            },
          },
        },
      })
      const daysRemaining = (hotspotEndDate.getTime() - now.getTime()) / 86_400_000
      if (daysRemaining > dropEveryDays) {

        const schedule = await qstash.schedules.create({
          destination: `${BASE_URL}/api/hotspot/drop`,
          cron: dropIntervalToCron(dropEveryDays),
          body: JSON.stringify({ hotspotId: hotspot.id }),
          headers: { "Content-Type": "application/json" },
        })
        await ctx.db.hotspot.update({
          where: { id: hotspot.id },
          data: { qstashScheduleId: schedule.scheduleId },
        })
      }

      return { hotspotId: hotspot.id }
    }),



  // Lightweight list — title + image come from Hotspot directly, no join needed
  myHotspots: creatorProcedure.query(async ({ ctx }) => {
    return ctx.db.hotspot.findMany({
      where: { creatorId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    })
  }),
  getHotspot: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
        include: {
          locationGroups: {
            orderBy: { startDate: "desc" },
            include: {
              locations: { include: { consumers: true } },
            },
          },
        },
      });
      if (!hotspot) return null;


      // ask qstash for the schedule if we have an id
      let qstashInfo: Awaited<ReturnType<typeof qstash.schedules.get>> | null =
        null;
      if (hotspot.qstashScheduleId) {
        console.log("Fetching QStash schedule info for ID:", hotspot.qstashScheduleId);
        qstashInfo = await qstash.schedules
          .get(hotspot.qstashScheduleId)
          .catch(() => null);
        console.log("QStash schedule info:", qstashInfo);
      }
      return { ...hotspot, qstash: qstashInfo ?? undefined, };
    }),
  pauseHotspotSchedule: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const h = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
      });
      if (!h) throw new TRPCError({ code: "NOT_FOUND" });

      if (h.qstashScheduleId) {
        await qstash.schedules.pause({
          schedule: h.qstashScheduleId,
        }).catch(() => null);
      }
      await ctx.db.hotspot.update({
        where: { id: input.hotspotId },
        data: { isActive: false },
      });
      return { ok: true };
    }),
  resumeHotspotSchedule: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const h = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
      });
      if (!h) throw new TRPCError({ code: "NOT_FOUND" });

      if (h.qstashScheduleId) {
        await qstash.schedules.resume({
          schedule: h.qstashScheduleId,
        }).catch(() => null);
      }
      await ctx.db.hotspot.update({
        where: { id: input.hotspotId },
        data: { isActive: true },
      });
      return { ok: true };
    }),
  deleteHotspotCascade: creatorProcedure
    .input(z.object({ hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const h = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId: ctx.session.user.id },
      });
      if (!h) throw new TRPCError({ code: "NOT_FOUND" });

      if (h.qstashScheduleId) {
        await qstash.schedules.pause({
          schedule: h.qstashScheduleId
        }).catch(() => null)

        await qstash.schedules.delete(h.qstashScheduleId).catch((e) => console.log("Failed to delete QStash schedule:", e));
      }
      // hide all children groups
      await ctx.db.locationGroup.updateMany({
        where: { hotspotId: input.hotspotId },
        data: { hidden: true },
      });
      await ctx.db.hotspot.update({
        where: { id: input.hotspotId },
        data: { isActive: false },
      });
      return { ok: true };
    }),
  createPin: creatorProcedure
    .input(createPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { pinNumber, pinCollectionLimit, token, tier, multiPin } = input;

      let tierId: number | undefined;
      let privacy: ItemPrivacy = ItemPrivacy.PUBLIC;

      if (!tier) {
        privacy = ItemPrivacy.PUBLIC;
      } else if (tier == "public") {
        privacy = ItemPrivacy.PUBLIC;
      } else if (tier == "private") {
        privacy = ItemPrivacy.PRIVATE;
      } else {
        tierId = Number(tier);
        privacy = ItemPrivacy.TIER;
      }

      let assetId = token;
      let pageAsset = false;

      if (token == PAGE_ASSET_NUM) {
        assetId = undefined;
        pageAsset = true;
      }

      const locations = Array.from({ length: pinNumber }).map(() => {
        const randomLocatin = getLocationInLatLngRad(
          input.lat,
          input.lng,
          input.radius,
        );
        return {
          autoCollect: input.autoCollect,
          latitude: randomLocatin.latitude,
          longitude: randomLocatin.longitude,
        };
      });

      await ctx.db.locationGroup.create({
        data: {
          creatorId: ctx.session.user.id,
          endDate: input.endDate,
          startDate: input.startDate,
          title: input.title,
          description: input.description,
          assetId: assetId,
          pageAsset: pageAsset,
          limit: pinCollectionLimit,
          image: input.image,
          link: input.url,
          locations: {
            createMany: {
              data: locations,
            },
          },
          subscriptionId: tierId,
          privacy: privacy,
          remaining: pinCollectionLimit,
          multiPin: multiPin,
        },
      });
    }),
  createForAdminPin: adminProcedure
    .input(createAdminPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        pinNumber,
        pinCollectionLimit,
        token,
        tier,
        multiPin,
        creatorId,
      } = input;

      const creator = await ctx.db.creator.findUnique({
        where: { id: creatorId },
      });
      if (!creator || !creatorId) throw new Error("Creator not found");

      let tierId: number | undefined;
      let privacy: ItemPrivacy = ItemPrivacy.PUBLIC;

      if (!tier) {
        privacy = ItemPrivacy.PUBLIC;
      } else if (tier == "public") {
        privacy = ItemPrivacy.PUBLIC;
      } else if (tier == "private") {
        privacy = ItemPrivacy.PRIVATE;
      } else {
        tierId = Number(tier);
        privacy = ItemPrivacy.TIER;
      }

      let assetId = token;
      let pageAsset = false;

      if (token == PAGE_ASSET_NUM) {
        assetId = undefined;
        pageAsset = true;
      }

      const locations = Array.from({ length: pinNumber }).map(() => {
        const randomLocatin = getLocationInLatLngRad(
          input.lat,
          input.lng,
          input.radius,
        );
        return {
          autoCollect: input.autoCollect,
          latitude: randomLocatin.latitude,
          longitude: randomLocatin.longitude,
        };
      });

      await ctx.db.locationGroup.create({
        data: {
          creatorId: creatorId,
          endDate: input.endDate,
          startDate: input.startDate,
          title: input.title,
          description: input.description,
          assetId: assetId,
          pageAsset: pageAsset,
          limit: pinCollectionLimit,
          image: input.image,
          link: input.url,
          locations: {
            createMany: {
              data: locations,
            },
          },
          subscriptionId: tierId,
          privacy: privacy,
          remaining: pinCollectionLimit,
          multiPin: multiPin,
        },
      });
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
        pin.locationGroup?.locations.flatMap((location) => {
          return location.consumers.map((consumer) => {
            return {
              pubkey: consumer.user.id,
              name: consumer.user.name ?? "Unknown",
              consumptionDate: consumer.createdAt,
            };
          });
        }) ?? [],
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
        pinId,
        lat,
        lng,
        description,
        title,
        image,
        startDate,
        endDate,
        url,
        pinRemainingLimit,
        autoCollect,
        multiPin,
      } = input;
      console.log("Input,", input);
      try {
        // Step 1: Find the Location object by pinId (which is the location ID)
        const findLocation = await ctx.db.location.findFirst({
          where: {
            id: pinId,
          },
          include: {
            locationGroup: true, // Include the LocationGroup associated with the Location
          },
        });

        // Step 2: If the location does not exist, return an error
        if (!findLocation || !findLocation.locationGroup) {
          throw new Error("Location or associated LocationGroup not found");
        }

        const update = await ctx.db.location.update({
          where: {
            id: pinId, // Use location ID to update
          },
          data: {
            latitude: lat,
            longitude: lng,
            autoCollect: autoCollect,
          },
        });

        let updatedLimit = findLocation.locationGroup.limit;
        let updatedRemainingLimit = findLocation.locationGroup.remaining;
        if (typeof pinRemainingLimit == "number") {
          const prevRemainingLimit = findLocation.locationGroup.remaining;
          const limitDiff = pinRemainingLimit - prevRemainingLimit;
          updatedLimit = updatedLimit + limitDiff;
          updatedRemainingLimit = pinRemainingLimit;
        }

        // console.log(">> prev", pinRemainingLimit);
        // console.log(">> updated", updatedLimit, updatedRemainingLimit);
        console.log("Multipin, Auto Collection", multiPin, autoCollect)
        const updatedLocationGroup = await ctx.db.locationGroup.update({
          where: {
            id: findLocation.locationGroup.id, // Use locationGroup ID to update
          },
          data: {
            title,
            description,
            image,
            startDate,
            endDate,
            limit: updatedLimit,
            remaining: updatedRemainingLimit,
            link: url,
            multiPin
          },
        });

        return updatedLocationGroup;
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
        ? {
          endDate: {
            lte: new Date(),
          },
        } // No date filter when showing all pins
        : { endDate: { gte: new Date() } }; // Only active pins

      const pins = await ctx.db.location.findMany({
        where: {
          locationGroup: {
            hidden: false,
            creatorId: ctx.session.user.id,
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
                      endDate: true,
                      startDate: true,
                      limit: true,
                      image: true,
                      description: true,
                      title: true,
                      link: true,
                      multiPin: true,
                      subscriptionId: true,
                      pageAsset: true,
                      privacy: true,
                      remaining: true,
                      assetId: true,
                    },
                  },
                  latitude: true,
                  longitude: true,
                  id: true,
                  autoCollect: true,
                },
              },
            },
          },
        },
      });

      return pins;
    }),

  getCreatorPins: adminProcedure
    .input(
      z.object({
        creator_id: z.string(),
        showExpired: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { showExpired = false, creator_id } = input;

      const dateCondition = showExpired
        ? {
          endDate: {
            lte: new Date(),
          },
        } // No date filter when showing all pins
        : { endDate: { gte: new Date() } }; // Only active pins

      const pins = await ctx.db.location.findMany({
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
                      endDate: true,
                      startDate: true,
                      limit: true,
                      image: true,
                      description: true,
                      title: true,
                      link: true,
                      multiPin: true,
                      subscriptionId: true,
                      pageAsset: true,
                      privacy: true,
                      remaining: true,
                      assetId: true,
                    },
                  },
                  latitude: true,
                  longitude: true,
                  id: true,
                  autoCollect: true,
                },
              },
            },
          },
        },
      });

      return pins;
    }),
  getRangePins: creatorProcedure
    .input(
      z.object({
        northLatitude: z.number(),
        southLatitude: z.number(),
        eastLongitude: z.number(),
        westLongitude: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { northLatitude, southLatitude, eastLongitude, westLongitude } =
        input;

      const pins = await ctx.db.location.findMany({
        where: {
          locationGroup: {
            creatorId: ctx.session.user.id,
            endDate: { gte: new Date() },
            approved: { equals: true },
          },
          // creatorId: ctx.session.user.id,
          latitude: {
            gte: southLatitude,
            lte: northLatitude,
          },
          longitude: {
            gte: westLongitude,
            lte: eastLongitude,
          },
        },
        include: {
          _count: { select: { consumers: true } },
          locationGroup: {
            include: {
              creator: { select: { profileUrl: true } },
            },
          },
        },
      });

      return pins;
    }),

  getAdminLocationGroups: adminProcedure.query(async ({ ctx, input }) => {
    const locationGroups = await ctx.db.locationGroup.findMany({
      where: { approved: { equals: null }, endDate: { gte: new Date() }, hidden: false },
      include: {
        creator: { select: { name: true, id: true } },
        locations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return locationGroups;
  }),
  getApprovedLocationGroups: adminProcedure.query(async ({ ctx, input }) => {
    const locationGroups = await ctx.db.locationGroup.findMany({
      where: { approved: { equals: true }, endDate: { gte: new Date() }, hidden: false },
      include: {
        creator: { select: { name: true, id: true } },
        locations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return locationGroups;
  }),

  getPinsGrops: adminProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.locationGroup.findMany({
      include: { locations: true },
    });

    return pins;
  }),

  approveLocationGroups: adminProcedure
    .input(
      z.object({
        locationGroupIds: z.array(z.string()),
        approved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.locationGroup.updateMany({
        where: {
          id: { in: input.locationGroupIds },
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
      include: { location: { include: { locationGroup: true } } },
      orderBy: { createdAt: "desc" },
    });
    return consumedLocations;
  }),

  getCreatorPinThatConsumed: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const consumedLocations = await ctx.db.locationConsumer.findMany({
      where: {
        location: {
          locationGroup: {
            creatorId,
          },
        },
      },
      include: {
        location: {
          select: {
            latitude: true,
            longitude: true,
            locationGroup: {
              select: {
                creator: true,
              },
            },
          },
        },

        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return consumedLocations;
  }),

  getCreatorPinTConsumedByUser: protectedProcedure
    .input(
      z.object({
        day: z.number().optional(),
        creatorId: z.string().optional(),
        isAdmin: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // console.log("Input for consumed pins", input);
      if (input?.isAdmin) {
        const admin = await ctx.db.admin.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!admin) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!input.creatorId) {
          console.log("Creator ID is required for admin view");

          return;
        }
      } else {
        const creator = await ctx.db.creator.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!creator) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
      }
      const selectedCreatorId = input?.creatorId;
      const consumedLocations = await ctx.db.locationGroup.findMany({
        where: {
          creatorId: selectedCreatorId,
          createdAt: input?.day
            ? {
              gte: new Date(
                new Date().getTime() - input.day * 24 * 60 * 60 * 1000,
              ),
            }
            : {},
        },
        select: {
          locations: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              autoCollect: true,
              _count: { select: { consumers: true } },
              consumers: {
                select: {
                  user: {
                    select: {
                      name: true,
                      id: true,
                      email: true,
                    },
                  },
                  claimedAt: true,
                },
              },
            },
          },
          startDate: true,
          endDate: true,
          title: true,
          id: true,
          creatorId: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const usersPublicKeys = Array.from(
        new Set(
          consumedLocations.flatMap((group) =>
            group.locations.flatMap((location) =>
              location.consumers.map((consumer) => consumer.user.id),
            ),
          ),
        ),
      );

      if (usersPublicKeys.length > 0) {
        const usersEmails = await fetchUsersByPublicKeys(
          Array.from(usersPublicKeys),
        );

        if (usersEmails.length > 0)
          consumedLocations.forEach((group) => {
            group.locations.forEach((location) => {
              location.consumers.forEach((consumer) => {
                const user = usersEmails.find(
                  (user) => user.publicKey === consumer.user.id,
                );
                consumer.user.email =
                  user?.email ?? consumer.user.email ?? "Unknown";
              });
            });
          });
      }

      return consumedLocations;
    }),
  downloadCreatorPinTConsumedByUser: protectedProcedure
    .input(
      z.object({
        day: z.number().optional(),
        creatorId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const creatorId = input.creatorId;
      if (!creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Creator ID is required",
        });
      }
      const consumedLocations = await ctx.db.locationGroup.findMany({
        where: {
          createdAt: input.day
            ? {
              gte: new Date(
                new Date().getTime() - input.day * 24 * 60 * 60 * 1000,
              ),
            }
            : {},
          creatorId,
        },
        select: {
          locations: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              autoCollect: true,
              _count: { select: { consumers: true } },
              consumers: {
                select: {
                  user: {
                    select: {
                      name: true,
                      id: true,
                      email: true,
                    },
                  },
                  claimedAt: true,
                },
              },
            },
          },
          creatorId: true,
          startDate: true,
          endDate: true,
          title: true,
          id: true,
        },
        orderBy: { createdAt: "desc" },
      });
      console.log(
        "Consumed locations",
        consumedLocations.length,
        consumedLocations[0],
      );

      if (consumedLocations.length > 0) {
        const usersPublicKeys = Array.from(
          new Set(
            consumedLocations.flatMap((group) =>
              group.locations.flatMap((location) =>
                location.consumers.map((consumer) => consumer.user.id),
              ),
            ),
          ),
        );
        const usersEmails = await fetchUsersByPublicKeys(
          Array.from(usersPublicKeys),
        );

        if (usersEmails.length > 0)
          consumedLocations.forEach((group) => {
            group.locations.forEach((location) => {
              location.consumers.forEach((consumer) => {
                const user = usersEmails.find(
                  (user) => user.publicKey === consumer.user.id,
                );
                consumer.user.email =
                  user?.email ?? consumer.user.email ?? "Unknown";
              });
            });
          });
      }

      return consumedLocations;
    }),

  getCreatorCreatedPin: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const locatoinGroups = await ctx.db.locationGroup.findMany({
      where: {
        creatorId,
        hidden: false,
      },
      include: {
        locations: {
          include: {
            _count: { select: { consumers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const locations = locatoinGroups.flatMap((group) => {
      return group.locations.map((location) => {
        return {
          title: group.title,
          description: group.description,
          image: group.image,
          startDate: group.startDate,
          endDate: group.endDate,
          approved: group.approved,
          ...location,
          consumers: location._count.consumers,
          createdAt: group.createdAt,
        } as LocationWithConsumers;
      });
    });

    return locations;
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
              locationGroup: {
                select: {
                  title: true,
                  creator: { select: { name: true } },
                  description: true,
                  approved: true,
                  id: true,
                },
              },
              latitude: true,
              longitude: true,
              id: true,
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const locations: PinLocation[] = consumedLocations.map((consumer) => {
        return {
          user: {
            name: consumer.user.name,
            email: consumer.user.email,
            id: consumer.user.id,
          },

          location: {
            latitude: consumer.location.latitude,
            longitude: consumer.location.longitude,
            creator: { name: consumer.location.locationGroup?.creator.name },
            title: consumer.location.locationGroup?.title,
          },
          createdAt: consumer.createdAt,
          id: consumer.location.id,
        } as PinLocation;
      });

      return locations;
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
        },
        include: {
          location: {
            select: {
              locationGroup: {
                select: {
                  title: true,
                  creator: { select: { name: true } },
                  description: true,
                  approved: true,
                  id: true,
                },
              },
              latitude: true,
              longitude: true,
              id: true,
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const locations: PinLocation[] = consumedLocations.map((consumer) => {
        return {
          user: {
            name: consumer.user.name,
            email: consumer.user.email,
            id: consumer.user.id,
          },

          location: {
            latitude: consumer.location.latitude,
            longitude: consumer.location.longitude,
            creator: { name: consumer.location.locationGroup?.creator.name },
            title: consumer.location.locationGroup?.title,
          },
          createdAt: consumer.createdAt,
          id: consumer.location.id,
        } as PinLocation;
      });

      return locations;
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
              locationGroup: {
                select: {
                  title: true,
                  creator: { select: { name: true } },
                },
              },
              latitude: true,
              longitude: true,
            },
          },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return consumedLocations;
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
    .input(z.object({ id: z.string(), isAutoCollect: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.location.update({
        where: { id: input.id },
        data: { autoCollect: input.isAutoCollect },
      });
    }),

  paste: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        lat: z.number(),
        long: z.number(),
        isCut: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const location = await ctx.db.location.findUnique({
        where: { id: input.id },
        include: { locationGroup: true },
      });
      if (!location) throw new Error("Location not found");

      const { lat, long } = input;
      if (ctx.session.user.id != location.locationGroup?.creatorId) {
        // now decide this user is admin
        const admin = await ctx.db.admin.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!admin) {
          throw new Error("You are not authorized to paste this pin");
        }
      }

      if (input.isCut) {
        console.log("isCuttt,,,,,,,,,,,,,,,,,,,", input.isCut);
        await ctx.db.location.update({
          where: { id: input.id },
          data: { latitude: lat, longitude: long },
        });
      } else {
        if (!location.locationGroup)
          throw new Error("Location group not found");
        await ctx.db.location.create({
          data: {
            autoCollect: location.autoCollect,
            latitude: lat,
            longitude: long,
            locationGroupId: location.locationGroup.id,
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
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.db.admin.findUnique({
        where: { id: ctx.session.user.id },
      });

      const items = await ctx.db.location.update({
        where: {
          id: input.id,
          ...(!isAdmin ? { locationGroup: { creatorId: ctx.session.user.id } } : {}),
        },
        data: { hidden: true },
      });
      return {
        item: items.id,
      };
    }),
  deletePinForAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.location.update({
        where: {
          id: input.id,
        },
        data: { hidden: true },
      });
      return {
        item: items.id,
      };
    }),
  deleteLocationGroupForAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.locationGroup.update({
        where: {
          id: input.id,
        },
        data: { hidden: true },
      });
      return {
        item: items.id,
      };
    }),

  // deleteLocationGroup: protectedProcedure
  //   .input(z.object({ id: z.string() }))
  //   .mutation(async ({ ctx, input }) => {
  //     const items = await ctx.db.locationGroup.update({
  //       where: {
  //         id: input.id,
  //         creatorId: ctx.session.user.id,
  //       },
  //       data: { hidden: true },
  //     });
  //     return {
  //       item: items.id,
  //     };
  //   }),

  getMyCollectedPins: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const cursor = input.cursor;

      const userId = ctx.session.user.id;
      const consumedLocations = await ctx.db.locationConsumer.findMany({
        where: {
          userId,
          hidden: false,
        },
        include: { location: { include: { locationGroup: true } } },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor
          ? {
            cursor: {
              id: cursor,
            },
          }
          : {}),
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (consumedLocations.length > limit) {
        const nextItem = consumedLocations.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: consumedLocations,
        nextCursor,
      };
    }),

  // ─── 1. lookupRedeemCode (unchanged) ──────────────────────────────────────────
  lookupRedeemCode: protectedProcedure
    .input(
      z.object({
        code: z.string().trim().toUpperCase().length(6),
        locationId: z.string(),
      })
    )
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

      // Code exists but belongs to a different location
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

  // ─── 2. getLocationGroupsWithConsumers (paginated + filtered) ─────────────────
  //
  //  cursor  – last group id (undefined = first page)
  //  search  – title search (server-side, case-insensitive)
  //  type    – "LANDMARK" | "EVENT" | undefined = both
  //  limit   – page size (default 10, max 50)
  //
  //  Returns: { items, nextCursor, total }

  getLocationGroupsWithConsumers: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        search: z.string().optional(),
        type: z.enum(["LANDMARK", "EVENT"]).optional(),
        limit: z.number().min(1).max(50).default(PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { cursor, search, type, limit } = input;

      const where = {
        creatorId,
        hidden: false,
        type: type
          ? { equals: type }
          : { in: [PinType.LANDMARK, PinType.EVENT] },
        ...(search?.trim()
          ? { title: { contains: search.trim(), mode: "insensitive" as const } }
          : {}),
      };

      const total = await ctx.db.locationGroup.count({ where });
      // Check what findMany actually returns without pagination
      const allItems = await ctx.db.locationGroup.findMany({
        where,
        select: { id: true, title: true, updatedAt: true }
      });

      console.log("COUNT:", total);
      console.log("FINDMANY WITHOUT PAGINATION:", allItems.length);
      console.log("FINDMANY IDs:", allItems.map(g => g.id));

      const groups = await ctx.db.locationGroup.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),


        include: {
          locations: {
            include: {
              consumers: {
                include: {
                  user: { select: { name: true, image: true, email: true } },
                },
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
            id: group.id,
            title: group.title,
            description: group.description,
            image: group.image,
            link: group.link,
            type: group.type,
            startDate: group.startDate,
            endDate: group.endDate,
            limit: group.limit,
            remaining: group.remaining,
            totalConsumers: allConsumers.length,
            totalRedeemed: allConsumers.filter((c) => c.isRedeemed).length,
            latestConsumerAt: latestConsumer?.toISOString() ?? null,
            locations: group.locations.map((loc) => ({
              id: loc.id,
              latitude: loc.latitude,
              longitude: loc.longitude,
              consumers: loc.consumers.map((c) => ({
                id: c.id,
                redeemCode: c.redeemCode,
                isRedeemed: c.isRedeemed,
                redeemedAt: c.redeemedAt?.toISOString() ?? null,
                claimedAt: c.claimedAt?.toISOString() ?? null,
                user: c.user,
              })),
            })),
          };
        })
        // Re-sort by latest consumer activity within the page
        .sort((a, b) => {
          if (!a.latestConsumerAt && !b.latestConsumerAt) return 0;
          if (!a.latestConsumerAt) return 1;
          if (!b.latestConsumerAt) return -1;
          return (
            new Date(b.latestConsumerAt).getTime() -
            new Date(a.latestConsumerAt).getTime()
          );
        });
      console.log("CURSOR:", cursor);
      console.log("LIMIT:", limit);

      return { items, nextCursor, total };
    }),

  // ─── 3. getRedeemedByCreator (paginated + filtered) ───────────────────────────
  //
  //  cursor  – last LocationConsumer id (undefined = first page)
  //  search  – searches user.name, user.email, redeemCode, locationGroup.title
  //  type    – "LANDMARK" | "EVENT" | undefined = both
  //  limit   – page size (default 10, max 50)
  //
  //  Returns: { items, nextCursor, total }

  getRedeemedByCreator: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        search: z.string().optional(),
        type: z.enum(["LANDMARK", "EVENT"]).optional(),
        limit: z.number().min(1).max(50).default(PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { cursor, search, type, limit } = input;
      const searchTrim = search?.trim();

      const where = {
        isRedeemed: true,
        location: {
          locationGroup: {
            creatorId,
            hidden: false,
            type: type
              ? { equals: type }
              : { in: [PinType.LANDMARK, PinType.EVENT] },
          },
        },
        ...(searchTrim
          ? {
            OR: [
              { redeemCode: { contains: searchTrim, mode: "insensitive" as const } },
              { user: { name: { contains: searchTrim, mode: "insensitive" as const } } },
              { user: { email: { contains: searchTrim, mode: "insensitive" as const } } },
              {
                location: {
                  locationGroup: {
                    title: { contains: searchTrim, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
          : {}),
      };

      const total = await ctx.db.locationConsumer.count({ where });
      console.log("Total redeemed count for creator", creatorId, "is", total);
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
      if (redeemed.length > limit) {
        nextCursor = redeemed.pop()?.id;
      }

      const items = redeemed.map((c) => ({
        id: c.id,
        redeemCode: c.redeemCode,
        redeemedAt: c.redeemedAt?.toISOString() ?? null,
        claimedAt: c.claimedAt?.toISOString() ?? null,
        user: c.user,
        location: c.location.locationGroup,
        locationData: {
          latitude: c.location.latitude,
          longitude: c.location.longitude,
        },
      }));

      return { items, nextCursor, total };
    }),
  redeemByCode: publicProcedure // swap to protectedProcedure if creators must be logged in
    .input(
      z.object({
        code: z
          .string()
          .trim()
          .toUpperCase()
          .length(6, "Code must be exactly 6 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const consumer = await ctx.db.locationConsumer.findUnique({
        where: { redeemCode: input.code },
        include: {
          user: { select: { name: true, image: true, email: true } },
          location: {
            include: {
              locationGroup: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  image: true,
                  link: true,
                  type: true,
                  startDate: true,
                  endDate: true,
                  creator: { select: { name: true } },
                },
              }
            }
          },
        },
      })

      if (!consumer) {
        return { status: "not_found" as const }
      }

      if (consumer.isRedeemed) {
        return {
          status: "already_redeemed" as const,
          redeemedAt: consumer.redeemedAt?.toISOString() ?? null,
          user: consumer.user,
          location: consumer.location.locationGroup,
          locationData: {
            latitude: consumer.location.latitude,
            longitude: consumer.location.longitude,
          },
        }
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
                  id: true,
                  title: true,
                  description: true,
                  image: true,
                  link: true,
                  type: true,
                  startDate: true,
                  endDate: true,
                  creator: { select: { name: true } },
                },
              }
            }
          },
        },
      })

      return {
        status: "success" as const,
        redeemedAt: updated.redeemedAt?.toISOString() ?? null,
        user: updated.user,
        location: updated.location.locationGroup,
        locationData: {
          latitude: updated.location.latitude,
          longitude: updated.location.longitude,
        },
      }
    }),
  // ─── Summary counts ─────────────────────────────────────────────────────────
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;

    const [general, landmark, event, hotspot] = await Promise.all([
      ctx.db.locationGroup.count({
        where: { creatorId, hotspotId: null, type: PinType.OTHER },
      }),
      ctx.db.locationGroup.count({
        where: { creatorId, hotspotId: null, type: PinType.LANDMARK },
      }),
      ctx.db.locationGroup.count({
        where: { creatorId, hotspotId: null, type: PinType.EVENT },
      }),
      ctx.db.hotspot.count({ where: { creatorId } }),
    ]);

    return { general, landmark, event, hotspot };
  }),

  // ─── Location groups (General / Landmark / Event) ────────────────────────────
  getLocationGroups: protectedProcedure
    .input(
      z.object({
        type: z.enum(["general", "landmark", "event"]),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const pinTypeMap: Record<string, PinType> = {
        general: PinType.OTHER,
        landmark: PinType.LANDMARK,
        event: PinType.EVENT,
      };

      const groups = await ctx.db.locationGroup.findMany({
        where: {
          creatorId,
          hotspotId: null,
          type: pinTypeMap[input.type],
          ...(input.search
            ? {
              title: { contains: input.search, mode: "insensitive" },
            }
            : {}),
        },
        include: {
          locations: {
            include: {
              _count: { select: { consumers: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (groups.length > input.limit) {
        nextCursor = groups.pop()!.id;
      }

      return { groups, nextCursor };
    }),

  // ─── Update location group ────────────────────────────────────────────────────
  updateLocationGroup: protectedProcedure
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { id, ...data } = input;

      const group = await ctx.db.locationGroup.findFirst({
        where: { id, creatorId },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      return ctx.db.locationGroup.update({ where: { id }, data });
    }),

  // ─── Delete single location group ─────────────────────────────────────────────
  deleteLocationGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const group = await ctx.db.locationGroup.findFirst({
        where: { id: input.id, creatorId },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      await ctx.db.locationGroup.update({
        where: { id: input.id },
        data: { hidden: true },
      });
      return { success: true };
    }),

  // ─── Bulk delete location groups ─────────────────────────────────────────────
  bulkDeleteLocationGroups: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      // Verify ownership of all groups
      const count = await ctx.db.locationGroup.count({
        where: { id: { in: input.ids }, creatorId },
      });
      if (count !== input.ids.length)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Some groups do not belong to you",
        });

      await ctx.db.locationGroup.updateMany({
        where: { id: { in: input.ids } },
        data: { hidden: true },
      });
      return { deleted: input.ids.length };
    }),

  // ─── Delete single location (pin) ─────────────────────────────────────────────
  deleteLocation: protectedProcedure
    .input(z.object({ locationId: z.string(), locationGroupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      // Verify the location belongs to a group owned by this creator
      const group = await ctx.db.locationGroup.findFirst({
        where: { id: input.locationGroupId, creatorId },
      });
      if (!group)
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      await ctx.db.location.update({ where: { id: input.locationId }, data: { hidden: true } });
      return { success: true };
    }),

  // ─── Bulk delete locations ────────────────────────────────────────────────────
  bulkDeleteLocations: protectedProcedure
    .input(
      z.object({
        locationIds: z.array(z.string()).min(1),
        locationGroupId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const group = await ctx.db.locationGroup.findFirst({
        where: { id: input.locationGroupId, creatorId },
      });
      if (!group)
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      await ctx.db.location.updateMany({
        where: { id: { in: input.locationIds }, locationGroupId: input.locationGroupId },
        data: { hidden: true },
      });
      return { deleted: input.locationIds.length };
    }),

  // ─── Hotspots ──────────────────────────────────────────────────────────────────
  getHotspots: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const hotspots = await ctx.db.hotspot.findMany({
        where: { creatorId },
        include: {
          locationGroups: {
            include: {
              locations: {
                include: { _count: { select: { consumers: true } } },
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
      if (hotspots.length > input.limit) {
        nextCursor = hotspots.pop()!.id;
      }

      return { hotspots, nextCursor };
    }),

  // ─── Toggle hotspot active ────────────────────────────────────────────────────
  toggleHotspotActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.id, creatorId },
      });
      if (!hotspot)
        throw new TRPCError({ code: "NOT_FOUND", message: "Hotspot not found" });

      const active = hotspot.isActive;

      if (active) {
        if (hotspot.qstashScheduleId) {
          await qstash.schedules.pause({
            schedule: hotspot.qstashScheduleId,
          }).catch(() => null);
        }
      }
      else {
        if (hotspot.qstashScheduleId) {
          await qstash.schedules.resume({
            schedule: hotspot.qstashScheduleId,
          }).catch(() => null);
        }
      }

      return ctx.db.hotspot.update({
        where: { id: input.id },
        data: { isActive: !hotspot.isActive },
      });
    }),

  // ─── Delete hotspot drop group ────────────────────────────────────────────────
  deleteHotspotDropGroup: protectedProcedure
    .input(z.object({ locationGroupId: z.string(), hotspotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId },
      });
      if (!hotspot)
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      await ctx.db.locationGroup.update({
        where: { id: input.locationGroupId },
        data: { hidden: true },
      });
      return { success: true };
    }),

  // ─── Bulk delete hotspot drop groups ─────────────────────────────────────────
  bulkDeleteHotspotDropGroups: protectedProcedure
    .input(
      z.object({
        locationGroupIds: z.array(z.string()).min(1),
        hotspotId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const hotspot = await ctx.db.hotspot.findFirst({
        where: { id: input.hotspotId, creatorId },
      });
      if (!hotspot)
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

      await ctx.db.locationGroup.updateMany({
        where: {
          id: { in: input.locationGroupIds },
          hotspotId: input.hotspotId,
        },
        data: { hidden: true },
      });
      return { deleted: input.locationGroupIds.length };
    }),


});


export async function dropPinsForHotspot(db: PrismaClient, hotspotId: string) {
  const hotspot = await db.hotspot.findUnique({
    where: { id: hotspotId }, include: {
      locationGroups: {
        select: {
          limit: true,
        }
      }
    }
  })
  if (!hotspot || !hotspot.isActive) return { skipped: true }

  const now = new Date()

  if (now > new Date(hotspot.hotspotEndDate)) {
    await db.hotspot.update({ where: { id: hotspotId }, data: { isActive: false } })
    if (hotspot.qstashScheduleId) {
      await qstash.schedules.pause({
        schedule: hotspot.qstashScheduleId
      }).catch(() => null)

      await qstash.schedules.delete(hotspot.qstashScheduleId).catch(() => null)
    }
    return { expired: true }
  }

  // Read the most recent LocationGroup for content fields
  const lastGroup = await db.locationGroup.findFirst({
    where: { hotspotId },
    orderBy: { startDate: "desc" },
  })
  if (!lastGroup) return { skipped: true, reason: "no locationGroup found" }

  const pinEndDate = new Date(now.getTime() + hotspot.pinDurationDays * 86_400_000)

  const locations = generateRandomLocations(
    hotspot.shape as "circle" | "rectangle" | "polygon",
    hotspot.geoJson as GeoJSON.Feature | null,
    lastGroup.limit ?? 0,  // from Hotspot directly
  ).map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    autoCollect: hotspot.autoCollect,
  }))

  await db.locationGroup.create({
    data: {
      hotspotId: hotspot.id,
      creatorId: lastGroup.creatorId,
      title: lastGroup.title,
      description: lastGroup.description,
      image: lastGroup.image,
      link: lastGroup.link,
      type: lastGroup.type,
      approved: true,
      privacy: lastGroup.privacy,
      multiPin: lastGroup.multiPin,
      assetId: lastGroup.assetId,
      pageAsset: lastGroup.pageAsset,
      limit: lastGroup.limit,
      remaining: lastGroup.limit,
      subscriptionId: lastGroup.subscriptionId,
      startDate: now,
      endDate: pinEndDate,
      locations: {
        createMany: { data: locations },
      },
    },
  })

  return { droppedAt: now.toISOString(), count: locations.length }
}