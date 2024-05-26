import { createTRPCRouter } from "~/server/api/trpc";
import { pinRouter } from "./pin";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const mapsRouter = createTRPCRouter({
  pin: pinRouter,
});

// export type definition of API
