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

  getCreatorNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.notification.findMany({
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
  }),
});
