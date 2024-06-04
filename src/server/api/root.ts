import { createTRPCRouter } from "~/server/api/trpc";
import { fanRouter } from "./routers/fan/root";
import { musicRouter } from "./routers/music/root";
import { marketplaceRouter } from "./routers/marketplace/root";
import { wallateRouter } from "./routers/wallate/root";
import { authRouter } from "./routers/auth/root";
import { mapsRouter } from "./routers/maps/root";
import { gameRouter } from "./routers/game";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  fan: fanRouter,
  music: musicRouter,
  marketplace: marketplaceRouter,
  wallate: wallateRouter,
  auth: authRouter,
  maps: mapsRouter,
  game: gameRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
