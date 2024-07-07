import { createTRPCRouter } from "~/server/api/trpc";
import { marketRouter } from "./marketplace";
import { stellarRouter } from "./steller";
import { payRouter } from "./pay";
import { tradeRouter } from "./trade";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const marketplaceRouter = createTRPCRouter({
  market: marketRouter,
  steller: stellarRouter,
  pay: payRouter,
  trade: tradeRouter,
});

// export type definition of API
