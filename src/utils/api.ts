/**
 * The client-side entrypoint for the tRPC API (App Router).
 *
 * `api` keeps its name and shape (`api.x.y.useQuery()`), so every existing
 * call site works unchanged; `TRPCReactProvider` (mounted once in the root
 * layout) supplies the query client and links.
 */
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { createTRPCReact } from "@trpc/react-query";

import { type AppRouter } from "~/server/api/root";

export const api = createTRPCReact<AppRouter>({
  overrides: {
    useMutation: {
      /**
       * Every successful mutation refreshes all queries (same behaviour the
       * portal has always had). Runs the mutation's own onSuccess first, so a
       * redirect inside it happens before the refetch flashes stale content.
       */
      async onSuccess(opts) {
        await opts.originalFn();
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});

/** @example type HelloInput = RouterInputs['example']['hello'] */
export type RouterInputs = inferRouterInputs<AppRouter>;

/** @example type HelloOutput = RouterOutputs['example']['hello'] */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
