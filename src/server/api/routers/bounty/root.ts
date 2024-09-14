import { createTRPCRouter } from "~/server/api/trpc";
import { BountyRoute } from "./bounty";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const BountyRouters = createTRPCRouter({
    Bounty: BountyRoute,
});

// export type definition of API
