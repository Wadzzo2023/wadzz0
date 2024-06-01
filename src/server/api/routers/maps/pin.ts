import { z } from "zod";
import { createPinFormSchema } from "~/components/maps/modals/create-pin";

import {
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { getLocationInLatLngRad } from "~/utils/map";

export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  createPin: creatorProcedure
    .input(createPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        isSinglePin,
        radius,
        pinNumber,
        pinCollectionLimit,
        tokenAmount: totalTokenAmount,
        token: tokenId,
      } = input;
      const claimAmount = totalTokenAmount
        ? totalTokenAmount / pinCollectionLimit
        : undefined;

      if (isSinglePin) {
        return await ctx.db.location.create({
          data: {
            claimAmount,
            assetId: tokenId,

            autoCollect: input.autoCollect,
            limit: input.pinCollectionLimit,
            endDate: input.endDate,
            latitude: input.lat,
            longitude: input.lng,
            title: input.title,
            creatorId: ctx.session.user.id,
            isActive: true,
            startDate: input.startDate,
            description: input.description,
          },
        });
      } else {
        let claimAmount = undefined;
        if (totalTokenAmount) {
          const amountPerPin = totalTokenAmount / pinNumber;
          claimAmount = amountPerPin / pinCollectionLimit;
        }

        const locations = Array.from({ length: pinNumber }).map(() => {
          const randomLocatin = getLocationInLatLngRad(input.radius, {
            latitude: input.lat,
            longitude: input.lng,
          });
          return {
            claimAmount,
            assetId: tokenId,
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
          };
        });
        console.log(locations);

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
      }
    }),

  getMyPins: creatorProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.location.findMany({
      where: {
        creatorId: ctx.session.user.id,
      },
    });

    return pins;
  }),
});
