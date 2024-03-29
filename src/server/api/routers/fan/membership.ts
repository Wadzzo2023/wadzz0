import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { CreatorAboutShema } from "~/components/fan/creator/about";
import { TierSchema } from "~/components/fan/creator/add-tier-modal";
import { EditTierSchema } from "~/components/fan/creator/edit-tier-modal";
import { AccountSchema } from "~/lib/stellar/fan/utils";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const selectedColumn = {
  code: true,
  name: true,
  price: true,
  features: true,
  priority: true,
  days: true,
  id: true,
  creatorId: true,
  issuer: true,
  escrow: true,
};

export const membershipRouter = createTRPCRouter({
  createMembership: protectedProcedure
    .input(TierSchema.extend({ escrow: AccountSchema }))
    .mutation(async ({ ctx, input }) => {
      const maxPriority = (await ctx.db.subscription.findFirst({
        where: { creatorId: ctx.session.user.id },
        select: { priority: true },
        orderBy: { priority: "desc" },
      })) ?? { priority: 0 };

      maxPriority.priority += 1;

      function getDaysBasedOnPriority(priority: number) {
        // for 1 60 day
        // for 2 30 day
        // for 3 7 day
        if (priority == 1) return 60;
        if (priority == 2) return 30;
        if (priority == 3) return 7;

        return 7;
      }

      await ctx.db.subscription.create({
        data: {
          code: input.name,
          issuer: input.escrow.publicKey,
          issuerPrivate: input.escrow.secretKey,

          creatorId: ctx.session.user.id,
          days: getDaysBasedOnPriority(maxPriority.priority),

          name: input.name,
          features: input.featureDescription,
          priority: maxPriority.priority,
          price: input.price,
        },
      });
    }),

  editTierModal: protectedProcedure
    .input(EditTierSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.subscription.update({
        data: {
          features: input.featureDescription,
          name: input.name,
          price: input.price,
        },
        where: {
          id: input.id,
        },
      });
    }),

  updateCreatorProfile: protectedProcedure
    .input(CreatorAboutShema)
    .mutation(async ({ ctx, input }) => {
      const { name, description } = input;
      await ctx.db.creator.update({
        data: { name, bio: description },
        where: { id: ctx.session.user.id },
      });
    }),

  getCreatorMembership: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return await ctx.db.subscription.findMany({
        where: { creatorId: input },
        select: selectedColumn,
      });
    }),

  aCraatorSubscribedToken: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user_Subscription.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscription: {
            creatorId: input.creatorId,
          },
        },
        include: { subscription: true },
        orderBy: { subscription: { priority: "asc" } },
      });
    }),
  getAllMembership: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.subscription.findMany({
      where: { creatorId: ctx.session.user.id },
      select: selectedColumn,
    });
  }),

  getAllSubscription: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user_Subscription.findMany({
      where: {
        AND: [
          { userId: ctx.session.user.id },
          // here i have to check not expired highest subscriptin.
          { subcriptionEndDate: { gte: new Date() } },
        ],
      },
      include: {
        subscription: {
          include: {
            creator: true,
          },
        },
      },
    });
  }),

  subscribe: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        creatorId: z.string(),
        days: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentDate = new Date();
      // Add 10 days to the current date
      currentDate.setDate(currentDate.getDate() + input.days);
      const subscription = await ctx.db.user_Subscription.create({
        data: {
          userId: ctx.session.user.id,
          subscriptionId: input.subscriptionId,
          subcriptionEndDate: currentDate,
        },
      });
      await ctx.db.notificationObject.create({
        data: {
          actorId: ctx.session.user.id,
          entityType: NotificationType.SUBSCRIPTION,
          entityId: input.subscriptionId,
          Notification: { create: [{ notifierId: input.creatorId }] },
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
