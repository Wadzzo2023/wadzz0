"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchStreamLink, httpLink, loggerLink, splitLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import superjson from "superjson";

import { api } from "~/utils/api";

/**
 * Query client + tRPC client for the whole app. Created once per browser
 * session (useState), never at module scope, so server renders don't share
 * a cache between requests.
 */
export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The portal is a working tool: don't refetch every time the tab
            // regains focus, but keep data a moment so tab switches are instant.
            refetchOnWindowFocus: false,
            staleTime: 15_000,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" && op.direction === "down" && op.result instanceof Error,
        }),
        // Stellar balance lookups (wallate.acc.*) call Horizon and can take
        // seconds; they go on their own so access checks and page data never
        // wait for them. Everything else is batched.
        splitLink({
          condition: (op) => op.path.startsWith("wallate.acc."),
          true: httpLink({ url: "/api/trpc", transformer: superjson }),
          false: httpBatchStreamLink({ url: "/api/trpc", transformer: superjson }),
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
