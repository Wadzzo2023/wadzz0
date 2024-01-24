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
      await ctx.db.subscription.create({
        data: {
          assetId: 1,
          creatorId: input.id,
          days: 10,
          name: input.name,
          features: input.featureDescription,
        },
      });
      const data = await ctx.db.creator.create({
        data: {
          name: "test user",
          bio: "test",
          user: { connect: { id: input.id } },
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

  getAllMembership: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.subscription.findMany({
        where: { creatorId: input },
      });
      return data;
    }),

  subscribe: protectedProcedure
    .input(z.object({ id: z.string(), subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.db.user_Subscription.create({
        data: { userId: input.id, subscriptionId: input.subscriptionId },
      });
      return subscription;
    }),

  userSubscriptions: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const subscriptiosn = await ctx.db.user_Subscription.findMany({
        where: { userId: input },
      });
      return subscriptiosn;
    }),
});
