import { z } from "zod";
import { CreatorAboutShema } from "~/components/creator/about";
import { TierSchema } from "~/components/creator/add-tier-modal";
import { AccounSchema } from "~/lib/stellar/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const membershipRouter = createTRPCRouter({
  createMembership: protectedProcedure
    .input(TierSchema.extend({ escrow: AccounSchema }))
    .mutation(async ({ ctx, input }) => {
      const maxPriority = (await ctx.db.subscription.findFirst({
        where: { creatorId: ctx.session.user.id },
        select: { priority: true },
        orderBy: { priority: "desc" },
      })) ?? { priority: 0 };

      maxPriority.priority += 1;

      const asset = await ctx.db.asset.create({
        data: {
          code: input.name,
          issuer: input.escrow.publicKey,
          issuerPrivate: input.escrow.secretKey,
          creatorId: ctx.session.user.id,
          escrow: true,
        },
      });

      await ctx.db.subscription.create({
        data: {
          assetId: asset.id,
          creatorId: ctx.session.user.id,
          days: input.day,
          name: input.name,
          features: input.featureDescription,
          priority: maxPriority.priority,
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
      include: {
        subscription: true,
      },
    });
  }),

  subscribe: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      let currentDate = new Date();
      // Add 10 days to the current date
      currentDate.setDate(currentDate.getDate() + 10);
      const subscription = await ctx.db.user_Subscription.create({
        data: {
          userId: ctx.session.user.id,
          subscriptionId: input.subscriptionId,
          endDate: currentDate,
        },
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
