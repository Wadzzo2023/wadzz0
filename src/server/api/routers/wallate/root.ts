import { createTRPCRouter } from "~/server/api/trpc";
import { assetRouter } from "./asset";
import { accRouter } from "./acc";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const wallateRouter = createTRPCRouter({
  asset: assetRouter,
  acc: accRouter,
});

// export type definition of API
