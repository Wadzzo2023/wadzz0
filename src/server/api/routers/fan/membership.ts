import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { CreatorAboutShema } from "~/components/fan/creator/about";
import { CreatorPageAssetSchema } from "~/components/fan/creator/page_asset/new";
import { TierSchema } from "~/components/fan/creator/add-tier-modal";
import { EditTierSchema } from "~/components/fan/creator/edit-tier-modal";
import { AccountSchema } from "~/lib/stellar/fan/utils";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const selectedColumn = {
  name: true,
  price: true,
  features: true,
  id: true,
  creatorId: true,
};

export const membershipRouter = createTRPCRouter({
  createMembership: protectedProcedure
    .input(TierSchema)
    .mutation(async ({ ctx, input }) => {
      const { featureDescription, name, price } = input;
      await ctx.db.subscription.create({
        data: {
          creatorId: ctx.session.user.id,
          name,
          features: featureDescription,
          price,
        },
      });
    }),

  createCreatePageAsset: protectedProcedure
    .input(CreatorPageAssetSchema.extend({ issuer: AccountSchema }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;

      const { code: code, issuer, limit, thumbnail } = input;

      await ctx.db.creatorPageAsset.create({
        data: {
          creatorId,
          limit: limit,
          code,
          issuer: issuer.publicKey,
          issuerPrivate: issuer.secretKey,
        },
      });
    }),

  createCustomPageAsset: protectedProcedure
    .input(z.object({ code: z.string(), issuer: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      const { code, issuer } = input;
      const assetIssuer = `${code}-${issuer}`;

      const creator = await ctx.db.creator.update({
        data: { customPageAssetCodeIssuer: assetIssuer },
        where: { id: creatorId },
      });

      return creator;
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

  deleteTier: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      return await ctx.db.subscription.delete({
        where: {
          id: input.id,
          creatorId: creatorId,
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

  // aCraatorSubscribedToken: protectedProcedure
  //   .input(z.object({ creatorId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     return await ctx.db.user_Subscription.findFirst({
  //       where: {
  //         userId: ctx.session.user.id,
  //         subscription: {
  //           creatorId: input.creatorId,
  //         },
  //       },
  //       include: { subscription: true },
  //     });
  //   }),
  getAllMembership: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.subscription.findMany({
      where: { creatorId: ctx.session.user.id },
      select: selectedColumn,
    });
  }),

  // getUserSubcribed: protectedProcedure.query(async ({ ctx }) => {
  //   return await ctx.db.user_Subscription.findMany({
  //     where: {
  //       AND: [
  //         { userId: ctx.session.user.id },
  //         // here i have to check not expired highest subscriptin.
  //         { subcriptionEndDate: { gte: new Date() } },
  //       ],
  //     },
  //     include: {
  //       subscription: {
  //         include: {
  //           creator: true,
  //         },
  //       },
  //     },
  //   });
  // }),

  // subscribe: protectedProcedure
  //   .input(
  //     z.object({
  //       subscriptionId: z.number(),
  //       creatorId: z.string(),
  //       days: z.number(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const currentDate = new Date();
  //     // Add 10 days to the current date
  //     currentDate.setDate(currentDate.getDate() + input.days);
  //     const subscription = await ctx.db.user_Subscription.create({
  //       data: {
  //         userId: ctx.session.user.id,
  //         subscriptionId: input.subscriptionId,
  //         subcriptionEndDate: currentDate,
  //       },
  //     });
  //     await ctx.db.notificationObject.create({
  //       data: {
  //         actorId: ctx.session.user.id,
  //         entityType: NotificationType.SUBSCRIPTION,
  //         entityId: input.subscriptionId,
  //         Notification: { create: [{ notifierId: input.creatorId }] },
  //       },
  //     });
  //     return subscription;
  //   }),

  // userSubscriptions: protectedProcedure.query(async ({ ctx, input }) => {
  //   const subscriptiosn = await ctx.db.user_Subscription.findMany({
  //     where: { userId: ctx.session.user.id },
  //   });
  //   return subscriptiosn;
  // }),

  isFollower: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isFollower = await ctx.db.follow.findUnique({
        where: {
          userId_creatorId: {
            creatorId: input.creatorId,
            userId: ctx.session.user.id,
          },
        },
      });
      if (isFollower) return true;
      else false;
    }),

  followCreator: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return await ctx.db.follow.create({
        data: { creatorId: input.creatorId, userId },
      });
    }),
});
