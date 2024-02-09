import { postRouter } from "~/server/api/routers/post";
import { createTRPCRouter } from "~/server/api/trpc";
import { creatorRouter } from "./routers/creator";
import { membershipRouter } from "./routers/membership";
import { shopRouter } from "./routers/shop";
import { trxRouter } from "./routers/trx";
import { notificationRouter } from "./routers/notification";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  creator: creatorRouter,
  member: membershipRouter,
  shop: shopRouter,
  trx: trxRouter,
  notification: notificationRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
