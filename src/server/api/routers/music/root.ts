import { createTRPCRouter } from "~/server/api/trpc";
import { albumRouter } from "./album";
import { songRouter } from "./song";
import { stellarRouter } from "./steller";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const musicRouter = createTRPCRouter({
  album: albumRouter,
  song: songRouter,
  steller: stellarRouter,
});

// export type definition of API
