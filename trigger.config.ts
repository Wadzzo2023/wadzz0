import { defineConfig } from "@trigger.dev/sdk/v3";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  build: {
    extensions: [
      prismaExtension({
        schema: "prisma/schema.prisma",
      }),
    ],
  },
  project: "proj_ifjzghwngjgjtawwycir",
  dirs: ["./src/trigger"],
});
