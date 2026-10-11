import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { StellarAccount } from "~/lib/stellar/account";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { isOwnS3Url, signImageUpload } from "~/server/s3";

const imageUrl = z.string().url().refine(isOwnS3Url, "Upload the image first");

/** My profile, and public fan profiles. */
export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) =>
    ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, name: true, bio: true, image: true, coverImage: true, email: true, joinedAt: true, creator: { select: { approved: true, notCreatorButSeller: true, name: true, profileUrl: true } } },
    }),
  ),

  profile: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({ where: { id: input.id }, select: { id: true, name: true, bio: true, image: true, coverImage: true, joinedAt: true } });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(100),
        bio: z.string().trim().max(200).optional(),
        image: imageUrl.optional(),
        coverImage: imageUrl.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.user.update({ where: { id: ctx.session.user.id }, data: input });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new TRPCError({ code: "CONFLICT", message: "That name is taken." });
        }
        throw e;
      }
    }),

  /** My platform-token balance (0 when my wallet isn't active or doesn't hold it). */
  platformBalance: protectedProcedure.query(async ({ ctx }) => ({ balance: (await StellarAccount.load(ctx.session.user.id))?.platformBalance() ?? 0 })),

  /** A presigned upload for a profile picture or cover. */
  imageUploadUrl: protectedProcedure
    .input(z.object({ fileType: z.string(), fileSize: z.number().int().positive(), checksum: z.string(), fileName: z.string().max(255) }))
    .mutation(({ input }) => signImageUpload(input)),
});
