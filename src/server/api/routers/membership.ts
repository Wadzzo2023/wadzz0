import { z } from "zod";
import { CreatorAboutShema } from "~/components/creator/about";
import { TierSchema } from "~/components/creator/add-tier-modal";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const membershipRouter = createTRPCRouter({
  createMembership: protectedProcedure
    .input(TierSchema)
    .mutation(async ({ ctx, input }) => {
      const maxPriority = (await ctx.db.subscription.findFirst({
        where: { creatorId: input.id },
        select: { priority: true },
        orderBy: { priority: "desc" },
      })) ?? { priority: 0 };

      maxPriority.priority += 1;

      await ctx.db.subscription.create({
        data: {
          priority: maxPriority.priority,
          assetId: 1,
          creatorId: input.id,
          days: 10,
          name: input.name,
          features: input.featureDescription,
        },
      });
    }),

  updateCreatorProfile: protectedProcedure
    .input(CreatorAboutShema)
    .mutation(async ({ ctx, input }) => {
      const { name, description, id } = input;
      await ctx.db.creator.update({
        data: { name, bio: description },
        where: { id },
      });
    }),

  getCreatorMembership: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return await ctx.db.subscription.findMany({
        where: { creatorId: input },
      });
    }),
  getAllMembership: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.subscription.findMany({
      where: { creatorId: ctx.session.user.id },
    });
  }),

  getAllSubscription: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user_Subscription.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      // include: {
      //   subscription: {
      //     include: {
      //       creator: true,
      //     },
      //   },
      // },
    });
  }),

  subscribe: protectedProcedure
    .input(z.object({  subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.db.user_Subscription.create({
        data: { userId: ctx.session.user.id, subscriptionId: input.subscriptionId },
      });
      return subscription;
    }),

  userSubscriptions: protectedProcedure.query(async ({ ctx, input }) => {
    const subscriptiosn = await ctx.db.user_Subscription.findMany({
      where: { userId: ctx.session.user.id },
    });
    return subscriptiosn;
  }),
});
