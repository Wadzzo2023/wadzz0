import "server-only";

import { cache } from "react";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * tRPC for server components: the same procedures (and access rules) the
 * browser uses, called directly. One caller per request.
 */
export const serverApi = cache(async () => createCaller(await createTRPCContext()));
