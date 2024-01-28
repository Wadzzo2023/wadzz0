import { postRouter } from "~/server/api/routers/post";
import { createTRPCRouter } from "~/server/api/trpc";
import { creatorRouter } from "./routers/creator";
import { membershipRouter } from "./routers/membership";
import { shopRouter } from "./routers/shop";

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
});

// export type definition of API
export type AppRouter = typeof appRouter;
