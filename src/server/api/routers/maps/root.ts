import { createTRPCRouter } from "~/server/api/trpc";
import { pinRouter } from "./pin";
import { trxRouter } from "./trx";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const mapsRouter = createTRPCRouter({
  pin: pinRouter,
  trx: trxRouter,
});

// export type definition of API
