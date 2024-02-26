import { exampleRouter } from "./example";
import { createTRPCRouter } from "~/server/api/trpc";
import { nftRouter } from "./nft";
import { marketRouter } from "./marketplace";
import { stellarRouter } from "./steller";
import { userRouter } from "./user";
import { payRouter } from "./pay";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const marketplaceRouter = createTRPCRouter({
  example: exampleRouter,
  nft: nftRouter,
  market: marketRouter,
  steller: stellarRouter,
  user: userRouter,
  pay: payRouter,
});

// export type definition of API
