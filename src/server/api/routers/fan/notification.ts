import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getCreatorNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        // cursor is a reference to the last item in the previous batch
        // it's used to fetch the next batch
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor } = input;

      const items = await ctx.db.notification.findMany({
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          AND: [
            {
              notifierId: ctx.session.user.id,
            },
            { isCreator: true },
          ],
        },
        include: {

          notificationObject: true,

        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getUserNotification: protectedProcedure
    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().nullish(),
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, skip, cursor } = input;

      // Fetch the current user's followers
      const followers = await ctx.db.follow.findMany({
        where: { userId: ctx.session.user.id },
        select: { creatorId: true },
      });

      // Extract the creator IDs from the followers list
      const followerIds = followers.map((follower) => follower.creatorId);

      // Fetch posts from the followers
      const posts = await ctx.db.post.findMany({
        where: {
          creatorId: {
            in: followerIds,
          },
        },
        include: {
          creator: {
            select: {
              profileUrl: true,
              name: true,
              id: true,
            }
          },
        },
        take: limit + 1,
        skip: skip,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop(); // return the last item from the array
        nextCursor = nextItem?.id;
      }

      return {
        posts,
        nextCursor,
      };
    }
    ),

});
