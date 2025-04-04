import { ItemPrivacy } from "@prisma/client";
import { z } from "zod";
import { createAdminPinFormSchema } from "~/components/maps/admin/create-pin";
import {
  NO_ASSET,
  PAGE_ASSET_NUM,
  createPinFormSchema,
} from "~/components/maps/modals/create-pin";
import { LocationWithConsumers } from "~/pages/maps/pins/creator";

import {
  adminProcedure,
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { PinLocation } from "~/types/pin";
import { BADWORDS } from "~/utils/banned-word";
import { randomLocation as getLocationInLatLngRad } from "~/utils/map";

export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
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
        description: pin.locationGroup?.description,
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

  updatePin: creatorProcedure
    .input(
      z.object({
        pinId: z.string(),
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
        startDate: z.date().optional(),
        endDate: z
          .date()
          .min(new Date(new Date().setHours(0, 0, 0, 0)))
          .optional(),
        url: z.string().url().optional(),
        autoCollect: z.boolean(),
        pinRemainingLimit: z.number().optional(),
      }),
    )
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

        // Step 3: Check if the logged-in user is the creator of the LocationGroup
        if (findLocation.locationGroup.creatorId !== ctx.session.user.id) {
          throw new Error(
            "Unauthorized: You are not the creator of this location group",
          );
        }

        console.log("Location Group to update:", findLocation.locationGroup);

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
          },
        });

        return updatedLocationGroup;
      } catch (e) {
        console.error("Error updating location group:", e);
        throw new Error("Failed to update location group");
      }
    }),
  getMyPins: creatorProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.location.findMany({
      where: {
        locationGroup: {
          creatorId: ctx.session.user.id,
          endDate: { gte: new Date() },
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const pins = await ctx.db.location.findMany({
        where: {
          locationGroup: {
            creatorId: input.creator_id,
            endDate: { gte: new Date() },
            approved: { equals: true },
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

  getLocationGroups: adminProcedure.query(async ({ ctx, input }) => {
    const locationGroups = await ctx.db.locationGroup.findMany({
      where: { approved: { equals: null }, endDate: { gte: new Date() } },
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
      where: { approved: { equals: true }, endDate: { gte: new Date() } },
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

  getCreatorPinTConsumedByUser: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const consumedLocations = await ctx.db.locationGroup.findMany({
      where: {
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
              },
            },
          },
        },
        startDate: true,
        endDate: true,
        title: true,
        id: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return consumedLocations;
  }),

  downloadCreatorPinTConsumedByUser: creatorProcedure
    .input(z.object({ day: z.number() }).optional())
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const consumedLocations = await ctx.db.locationGroup.findMany({
        where: {
          createdAt: input
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
                },
              },
            },
          },
          startDate: true,
          endDate: true,
          title: true,
          id: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return consumedLocations;
    }),

  getCreatorCreatedPin: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    const locatoinGroups = await ctx.db.locationGroup.findMany({
      where: {
        creatorId,
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

  paste: publicProcedure
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
      if (ctx.session?.user.id != location.locationGroup?.creatorId)
        throw new Error("You are not the creator of this pin");

      if (input.isCut) {
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
      const items = await ctx.db.location.delete({
        where: {
          id: input.id,
          locationGroup: { creatorId: ctx.session.user.id },
        },
      });
      return {
        item: items.id,
      };
    }),
  deleteLocationGroup: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.locationGroup.delete({
        where: {
          id: input.id,
          creatorId: ctx.session.user.id,
        },
      });
      return {
        item: items.id,
      };
    }),

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
});
