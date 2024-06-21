import { createTRPCRouter } from "~/server/api/trpc";
import { creatorRouter } from "./creator";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const adminRouter = createTRPCRouter({
  creator: creatorRouter,
});

// export type definition of API
