import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { endPoints, getSignedURL } from "~/server/s3";

export const s3Router = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getSignedURL: protectedProcedure
    .input(
      z.object({
        fileSize: z.number(),
        fileType: z.string(),
        checksum: z.string(),
        endPoint: z.enum(endPoints),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getSignedURL(input);
    }),
});
