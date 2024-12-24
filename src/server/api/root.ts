import { createTRPCRouter } from "~/server/api/trpc";
import { fanRouter } from "./routers/fan/root";
import { musicRouter } from "./routers/music/root";
import { marketplaceRouter } from "./routers/marketplace/root";
import { wallateRouter } from "./routers/wallate/root";
import { authRouter } from "./routers/auth/root";
import { mapsRouter } from "./routers/maps/root";
import { gameRouter } from "./routers/game";
import { wallateBalanceRouter } from "./routers/walletBalance/root";
import { adminRouter } from "./routers/admin/root";
import { BountyRouters } from "./routers/bounty/root";
import { s3Router } from "./routers/s3";

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
  walletBalance: wallateBalanceRouter,
  admin: adminRouter,
  bounty: BountyRouters,
  s3: s3Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
