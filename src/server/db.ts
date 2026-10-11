import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

/**
 * Prisma 7 connects through a driver adapter (node-postgres) instead of the
 * old Rust query engine's own connection. One client per process; in dev it
 * survives hot reloads on globalThis.
 */
function createClient() {
  return new PrismaClient({
    // Neon databases sleep when idle; give a cold start time to wake.
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 30_000 }),
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Secret keys are never loaded unless a query asks for them by name
    // (`select: { storageSecret: true }`), so a stray `include: { creator: true }`
    // can't send them to the browser.
    omit: {
      creator: { storageSecret: true },
      creatorPageAsset: { issuerPrivate: true },
      asset: { issuerPrivate: true },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();
/** The app's client type (with the secret omits), for helpers that take `db`. */
export type Db = typeof db;

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
