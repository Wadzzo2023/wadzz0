import { z } from "zod";
import { createPinFormSchema } from "~/components/maps/modals/create-pin";

import {
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  createPin: creatorProcedure
    .input(createPinFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {} = input;

      await ctx.db.location.create({
        data: {
          autoCollect: input.autoCollect,
          limit: input.limit,
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
