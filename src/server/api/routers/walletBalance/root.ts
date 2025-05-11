import { createTRPCRouter } from "~/server/api/trpc";
import { WBalanceRouter } from "./acc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const wallateBalanceRouter = createTRPCRouter({
  wallBalance : WBalanceRouter,
});

// export type definition of API
