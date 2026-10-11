import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { activityRouter } from "./routers/activity";
import { collectionRouter } from "./routers/collection";
import { marketRouter } from "./routers/market";
import { purchaseRouter } from "./routers/purchase";
import { txRouter } from "./routers/tx";

export const appRouter = createTRPCRouter({
  market: marketRouter,
  purchase: purchaseRouter,
  collection: collectionRouter,
  activity: activityRouter,
  tx: txRouter,
});

export type AppRouter = typeof appRouter;

/** Server-side caller (server components): `const api = createCaller(await createTRPCContext())`. */
export const createCaller = createCallerFactory(appRouter);
