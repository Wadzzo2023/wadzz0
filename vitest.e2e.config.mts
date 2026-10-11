import path from "node:path";
import { defineConfig } from "vitest/config";

// Runs the fan app's money flows end to end against the DEV database and Stellar testnet.
export default defineConfig({
  resolve: {
    alias: [
      { find: "server-only", replacement: path.resolve("e2e/server-only-stub.ts") },
      { find: /^~\//, replacement: path.resolve("src") + "/" },
      { find: /^package\//, replacement: path.resolve("package") + "/" },
    ],
  },
  test: { include: ["e2e/**/*.test.ts"], environment: "node", testTimeout: 540_000, hookTimeout: 60_000 },
});
