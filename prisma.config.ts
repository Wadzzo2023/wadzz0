import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 reads the connection URL here instead of from schema.prisma.
 * (The app's own client connects through the pg driver adapter in
 * src/server/db.ts; this is for the CLI: generate, studio, db push.)
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: env("DATABASE_URL") },
});
