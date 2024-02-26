import { createTRPCRouter } from "~/server/api/trpc";
import { albumRouter } from "./album";
import { songRouter } from "./song";
import { assetRouter } from "./asset";
import { stellarRouter } from "./steller";
import { userRouter } from "./user";
import { bannerRouter } from "./banner";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const musicRouter = createTRPCRouter({
  album: albumRouter,
  song: songRouter,
  asset: assetRouter,
  steller: stellarRouter,
  user: userRouter,
  banner: bannerRouter,
});

// export type definition of API
