import { configDefaults, defineConfig } from "vitest/config";

// `pnpm test` runs the fast unit tests; the end-to-end ones (e2e/, `pnpm test:e2e`) hit the dev database and Stellar testnet.
export default defineConfig({ test: { exclude: [...configDefaults.exclude, "e2e/**"] } });
