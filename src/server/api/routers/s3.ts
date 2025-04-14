import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { endPoints, getSignedURL } from "~/server/s3";

const fileUploadSchema = z.object({
  fileSize: z.number(),
  fileType: z.string(),
  checksum: z.string(),
  endPoint: z.enum(endPoints),
  fileName: z.string(),
});

export const s3Router = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getSignedURL: protectedProcedure
    .input(fileUploadSchema)
    .mutation(({ ctx, input }) => {
      return getSignedURL(input);
    }),

  getSignedMultiURLs: protectedProcedure
    .input(
      z.object({
        files: z.array(fileUploadSchema),
        endPoint: z.enum(endPoints).default("multiBlobUploader"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { files } = input;
      const urls = await Promise.all(files.map((file) => getSignedURL(file)));
      return urls;
    }),
});
